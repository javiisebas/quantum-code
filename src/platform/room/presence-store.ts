import { Redis } from '@upstash/redis';

/**
 * Live presence for a room: how many phones are currently connected. This is the
 * "life" layer — the host lobby shows players appear in real time as they join.
 *
 * Model: a Redis sorted set `presence:{ns}:{code}` whose members are player ids and
 * whose scores are the last-seen epoch ms. Phones send a heartbeat every few seconds
 * (`heartbeat`); reading the count (`countActive`) first prunes members older than the
 * activity window, then counts what remains — so a phone that closed its tab drops out
 * within one window.
 *
 * Kept deliberately behind these two functions so the transport can later move from
 * client polling to SSE/pub-sub without any caller changing.
 */

const ACTIVITY_WINDOW_MS = 15_000; // a phone is "present" if seen within 15s.
const KEY_TTL_SECONDS = 60 * 60; // presence sets self-expire after an idle hour.

const CREDENTIAL_ENV_PAIRS: readonly [string, string][] = [
    ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'],
    ['UPSTASH_REDIS_KV_REST_API_URL', 'UPSTASH_REDIS_KV_REST_API_TOKEN'],
];

const key = (namespace: string, code: number): string => `presence:${namespace}:${code}`;

interface PresenceBackend {
    heartbeat(namespace: string, code: number, playerId: string): Promise<void>;
    countActive(namespace: string, code: number): Promise<number>;
}

// ---------------------------------------------------------------------------
// Redis backend
// ---------------------------------------------------------------------------

const createRedisBackend = (url: string, token: string): PresenceBackend => {
    const client = new Redis({ url, token });

    const prune = async (k: string, now: number): Promise<void> => {
        await client.zremrangebyscore(k, 0, now - ACTIVITY_WINDOW_MS);
    };

    return {
        async heartbeat(namespace, code, playerId) {
            const k = key(namespace, code);
            const now = Date.now();
            await client.zadd(k, { score: now, member: playerId });
            await client.expire(k, KEY_TTL_SECONDS);
            await prune(k, now);
        },

        async countActive(namespace, code) {
            const k = key(namespace, code);
            await prune(k, Date.now());
            return (await client.zcard(k)) ?? 0;
        },
    };
};

// ---------------------------------------------------------------------------
// In-memory backend (dev-only fallback)
// ---------------------------------------------------------------------------

const globalForPresence = globalThis as unknown as {
    __presenceStore?: Map<string, Map<string, number>>;
};

const createMemoryBackend = (): PresenceBackend => {
    const store = (globalForPresence.__presenceStore ??= new Map<string, Map<string, number>>());

    const live = (k: string, now: number): Map<string, number> => {
        const set = store.get(k) ?? new Map<string, number>();
        for (const [member, seen] of set) {
            if (seen <= now - ACTIVITY_WINDOW_MS) set.delete(member);
        }
        store.set(k, set);
        return set;
    };

    return {
        async heartbeat(namespace, code, playerId) {
            const now = Date.now();
            live(key(namespace, code), now).set(playerId, now);
        },
        async countActive(namespace, code) {
            return live(key(namespace, code), Date.now()).size;
        },
    };
};

// ---------------------------------------------------------------------------
// Backend resolution (lazy, cached once) — mirrors room-store's strategy.
// ---------------------------------------------------------------------------

let backend: PresenceBackend | null = null;

const getBackend = (): PresenceBackend => {
    if (backend) return backend;

    const pair = CREDENTIAL_ENV_PAIRS.find(
        ([urlKey, tokenKey]) => process.env[urlKey] && process.env[tokenKey],
    );
    if (pair) {
        backend = createRedisBackend(process.env[pair[0]]!, process.env[pair[1]]!);
    } else {
        // No creds: in-memory in dev; in production presence simply reports what the
        // (empty) memory backend has rather than throwing — presence is non-critical.
        backend = createMemoryBackend();
    }
    return backend;
};

/** Record that `playerId` is alive in a room right now. */
export const heartbeat = (namespace: string, code: number, playerId: string): Promise<void> =>
    getBackend().heartbeat(namespace, code, playerId);

/** How many phones have sent a heartbeat within the activity window. */
export const countActive = (namespace: string, code: number): Promise<number> =>
    getBackend().countActive(namespace, code);
