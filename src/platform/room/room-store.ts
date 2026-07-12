import { Redis } from '@upstash/redis';

/**
 * Server-side persistence for a room's shared payload, keyed by `(namespace, code)`.
 *
 * This is the game-agnostic generalisation of the original Codenames board store:
 * every game publishes a JSON payload of its own shape under its own namespace
 * (e.g. `codenames:123456`, `spyfall:123456`), so two different games can share the
 * same 6-digit code space without ever colliding.
 *
 * Backends (resolved lazily, once, on first use):
 *   - Upstash Redis when credentials are present (production and any env with creds).
 *   - An in-memory Map fallback in NON-production when no creds exist, so games run
 *     locally without a live Upstash database. This NEVER activates in production:
 *     with no creds in production we still throw.
 *
 * The public API is four plain functions: `readRoom`, `writeRoomIfAbsent`,
 * `deleteRoom`, and `claimSeat` (an atomic per-room counter used by games where each
 * player receives a distinct secret, e.g. Spyfall / Undercover).
 */

const TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days.

// (url, token) env-var name pairs, in priority order. Covers the Upstash SDK native
// names (local `.env.local`) and the active Upstash Vercel integration
// (`UPSTASH_REDIS_` prefix). The legacy `KV_REST_API_*` vars point at an archived
// (dead) database, so they are intentionally NOT used as a fallback.
const CREDENTIAL_ENV_PAIRS: readonly [string, string][] = [
    ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'],
    ['UPSTASH_REDIS_KV_REST_API_URL', 'UPSTASH_REDIS_KV_REST_API_TOKEN'],
];

/** Redis key for a room's shared payload. */
const roomKey = (namespace: string, code: number): string => `${namespace}:${code}`;
/** Redis key for a room's monotonically increasing seat counter. */
const seatKey = (namespace: string, code: number): string => `${namespace}:${code}:seat`;

/** Normalize a stored payload (Upstash auto-deserializes JSON; be robust to raw strings). */
const parseStored = <T>(data: T | string | null): T | null => {
    if (data === null || data === undefined) {
        return null;
    }
    if (typeof data === 'string') {
        return JSON.parse(data) as T;
    }
    return data;
};

/**
 * Common backend contract. Both the Redis and in-memory implementations satisfy it,
 * so the exported functions don't care which one is active. The payload type `T` is
 * chosen by each caller (per game); the store treats it as opaque JSON.
 */
interface RoomStore {
    read<T>(namespace: string, code: number): Promise<T | null>;
    /**
     * Atomic create-if-absent. Returns the AUTHORITATIVE payload: the passed `value`
     * when this call created the key, or the pre-existing payload when the key already
     * existed (i.e. a concurrent writer won the race).
     */
    writeIfAbsent<T>(namespace: string, code: number, value: T): Promise<T>;
    delete(namespace: string, code: number): Promise<boolean>;
    /**
     * Atomically claim the next seat in a room, returning a 1-based seat number. Used
     * by games where every player gets a distinct assignment: each device claims a
     * unique seat and reads its own slot of the published payload.
     */
    claimSeat(namespace: string, code: number): Promise<number>;
}

// ---------------------------------------------------------------------------
// Redis-backed store
// ---------------------------------------------------------------------------

const createRedisStore = (url: string, token: string): RoomStore => {
    const client = new Redis({ url, token });

    return {
        async read<T>(namespace: string, code: number) {
            try {
                const data = await client.get<T | string>(roomKey(namespace, code));
                return parseStored<T>(data);
            } catch (error: unknown) {
                throw wrapError('reading', error);
            }
        },

        async writeIfAbsent<T>(namespace: string, code: number, value: T) {
            try {
                const key = roomKey(namespace, code);
                // Atomic SET NX EX: "OK" when created, null when the key already existed.
                // This closes the read-then-create race a naive getOrCreate would have.
                const result = await client.set(key, JSON.stringify(value), {
                    nx: true,
                    ex: TTL_SECONDS,
                });

                if (result === 'OK') {
                    return value;
                }

                // A concurrent writer already created the key — return its value as the
                // authoritative result. Fall back to our candidate only if it vanished
                // (deleted/expired) between the SET and the GET.
                const existing = parseStored<T>(await client.get<T | string>(key));
                return existing ?? value;
            } catch (error: unknown) {
                throw wrapError('writing', error);
            }
        },

        async delete(namespace: string, code: number) {
            try {
                // Drop the payload and its seat counter together.
                const removed = await client.del(roomKey(namespace, code));
                await client.del(seatKey(namespace, code));
                return removed > 0;
            } catch (error: unknown) {
                throw wrapError('deleting', error);
            }
        },

        async claimSeat(namespace: string, code: number) {
            try {
                const key = seatKey(namespace, code);
                // Atomic INCR returns the new value; first claimer gets seat 1.
                const seat = await client.incr(key);
                // Keep the counter alive as long as the room itself.
                await client.expire(key, TTL_SECONDS);
                return seat;
            } catch (error: unknown) {
                throw wrapError('claiming a seat in', error);
            }
        },
    };
};

const wrapError = (action: string, error: unknown): Error => {
    const detail = error instanceof Error ? error.message : 'unknown error';
    return new Error(`Error ${action} room in Redis: ${detail}`);
};

// ---------------------------------------------------------------------------
// In-memory store (dev-only fallback)
// ---------------------------------------------------------------------------

type MemoryEntry = { value: unknown; expiresAt: number };

// Stored on globalThis so the maps survive Next.js HMR module reloads in dev.
const globalForStore = globalThis as unknown as {
    __roomMemoryStore?: Map<string, MemoryEntry>;
    __roomSeatStore?: Map<string, number>;
};

const createMemoryStore = (): RoomStore => {
    const map = (globalForStore.__roomMemoryStore ??= new Map<string, MemoryEntry>());
    const seats = (globalForStore.__roomSeatStore ??= new Map<string, number>());

    const readLive = <T>(key: string): T | null => {
        const entry = map.get(key);
        if (!entry) {
            return null;
        }
        if (entry.expiresAt <= Date.now()) {
            map.delete(key);
            return null;
        }
        return entry.value as T;
    };

    return {
        async read<T>(namespace: string, code: number) {
            return readLive<T>(roomKey(namespace, code));
        },

        async writeIfAbsent<T>(namespace: string, code: number, value: T) {
            const key = roomKey(namespace, code);
            const existing = readLive<T>(key);
            if (existing !== null) {
                return existing;
            }
            map.set(key, { value, expiresAt: Date.now() + TTL_SECONDS * 1000 });
            return value;
        },

        async delete(namespace: string, code: number) {
            seats.delete(seatKey(namespace, code));
            return map.delete(roomKey(namespace, code));
        },

        async claimSeat(namespace: string, code: number) {
            const key = seatKey(namespace, code);
            const next = (seats.get(key) ?? 0) + 1;
            seats.set(key, next);
            return next;
        },
    };
};

// ---------------------------------------------------------------------------
// Backend resolution (lazy, cached once)
// ---------------------------------------------------------------------------

let store: RoomStore | null = null;

const getStore = (): RoomStore => {
    if (store) {
        return store;
    }

    const pair = CREDENTIAL_ENV_PAIRS.find(
        ([urlKey, tokenKey]) => process.env[urlKey] && process.env[tokenKey],
    );

    if (pair) {
        store = createRedisStore(process.env[pair[0]]!, process.env[pair[1]]!);
        return store;
    }

    // No credentials. Only fall back to in-memory OUTSIDE production so local dev works
    // without a live Upstash DB; in production, missing creds must fail loudly.
    if (process.env.NODE_ENV !== 'production') {
        console.warn(
            '[room-store] No Redis credentials found — using in-memory store (dev only). ' +
                'Data is not shared across processes and is lost on restart.',
        );
        store = createMemoryStore();
        return store;
    }

    throw new Error(
        'Missing Redis credentials: set UPSTASH_REDIS_REST_URL/TOKEN or ' +
            'UPSTASH_REDIS_KV_REST_API_URL/TOKEN',
    );
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Read a room's shared payload, or null when the code is unknown. */
export const readRoom = <T>(namespace: string, code: number): Promise<T | null> =>
    getStore().read<T>(namespace, code);

/** Atomically create a room's payload if absent, returning the authoritative value. */
export const writeRoomIfAbsent = <T>(namespace: string, code: number, value: T): Promise<T> =>
    getStore().writeIfAbsent<T>(namespace, code, value);

/** Delete a room (payload + seat counter). Returns whether a payload was removed. */
export const deleteRoom = (namespace: string, code: number): Promise<boolean> =>
    getStore().delete(namespace, code);

/** Claim the next 1-based seat in a room (atomic). */
export const claimSeat = (namespace: string, code: number): Promise<number> =>
    getStore().claimSeat(namespace, code);
