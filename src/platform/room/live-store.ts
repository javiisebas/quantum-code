import { Redis } from '@upstash/redis';

/**
 * Server-side persistence for LIVE, phase-based games (Chispas, Sintonía…), the layer
 * that lets phones submit and everyone watch the game advance — the piece the original
 * "deal a secret then talk IRL" games (Spyfall/Undercover) deliberately did without.
 *
 * It complements `room-store` (the write-once shared payload) with two mutable channels,
 * both host-authoritative so game logic stays on one device (like the Codenames board)
 * while phones only read state and push their own input:
 *
 *   1. STATE  — a single public document per room, written only by the host and polled
 *      by every phone. `{ rev, state }`: `state` is the game's public snapshot (current
 *      phase, prompts to show, scores…) and `rev` a monotonic stamp phones use to skip
 *      re-renders when nothing changed. Last write wins; the host is the sole writer.
 *
 *   2. INPUTS — per-seat submissions for a given round, stored as a Redis HASH keyed by
 *      round with one field per seat. Each phone writes ONLY its own field, so two phones
 *      submitting at once never race (no read-modify-write); the host reads the whole hash
 *      to fold answers/votes/roster into the next state. A round is any host-chosen bucket
 *      id (e.g. `0` for the name roster, `1..n` for game rounds, or a phase-scoped id).
 *
 * Transport is the same short-interval polling as presence — deliberately behind these
 * functions so it can move to SSE/pub-sub later without any game screen changing.
 *
 * Backends mirror `room-store` exactly: Upstash Redis when creds exist, else an in-memory
 * Map fallback OUTSIDE production (throws in production with no creds).
 */

const TTL_SECONDS = 6 * 60 * 60; // 6h — live games are ephemeral; long enough for a party.

// Same credential resolution as room-store / presence-store (kept local so this module
// has no cross-store coupling; a shared resolver is a future cleanup for all three).
const CREDENTIAL_ENV_PAIRS: readonly [string, string][] = [
    ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'],
    ['UPSTASH_REDIS_KV_REST_API_URL', 'UPSTASH_REDIS_KV_REST_API_TOKEN'],
];

/** Public state document as stored/returned: a monotonic stamp plus the game snapshot. */
export interface StateDoc<S> {
    rev: number;
    state: S;
}

const stateKey = (namespace: string, code: number): string => `live:${namespace}:${code}`;
const inputsKey = (namespace: string, code: number, round: number): string =>
    `live:${namespace}:${code}:in:${round}`;
// Per-seat PRIVATE state (host → one phone): a Redis hash keyed by round, one field per seat.
// The mirror image of inputs — the host writes a secret slice per seat (e.g. Sintonía's target
// for the psychic), and each phone reads ONLY its own field (gated by that seat's token), so a
// secret the game must show to exactly one player never rides the public state document.
const privateKey = (namespace: string, code: number, round: number): string =>
    `live:${namespace}:${code}:pv:${round}`;

/**
 * Normalize a stored JSON blob (Upstash may hand back either the parsed object or the raw
 * string depending on content), matching room-store's robustness.
 */
const parseStored = <T>(data: T | string | null | undefined): T | null => {
    if (data === null || data === undefined) return null;
    if (typeof data === 'string') {
        try {
            return JSON.parse(data) as T;
        } catch {
            return null;
        }
    }
    return data;
};

interface LiveBackend {
    readState<S>(namespace: string, code: number): Promise<StateDoc<S> | null>;
    writeState<S>(namespace: string, code: number, doc: StateDoc<S>): Promise<void>;
    clearState(namespace: string, code: number): Promise<void>;
    putInput<V>(
        namespace: string,
        code: number,
        round: number,
        seat: number,
        value: V,
    ): Promise<void>;
    readInputs<V>(namespace: string, code: number, round: number): Promise<Record<number, V>>;
    putPrivate<V>(
        namespace: string,
        code: number,
        round: number,
        seat: number,
        value: V,
    ): Promise<void>;
    readPrivate<V>(namespace: string, code: number, round: number, seat: number): Promise<V | null>;
}

// ---------------------------------------------------------------------------
// Redis backend
// ---------------------------------------------------------------------------

const createRedisBackend = (url: string, token: string): LiveBackend => {
    const client = new Redis({ url, token });

    return {
        async readState<S>(namespace: string, code: number) {
            const data = await client.get<StateDoc<S> | string>(stateKey(namespace, code));
            return parseStored<StateDoc<S>>(data);
        },

        async writeState<S>(namespace: string, code: number, doc: StateDoc<S>) {
            await client.set(stateKey(namespace, code), JSON.stringify(doc), { ex: TTL_SECONDS });
        },

        async clearState(namespace: string, code: number) {
            await client.del(stateKey(namespace, code));
        },

        async putInput<V>(namespace: string, code: number, round: number, seat: number, value: V) {
            const key = inputsKey(namespace, code, round);
            // Envelope the value in an object so a robust parse is unambiguous regardless of
            // whether Upstash re-parses the field on read. String key so the field map is a
            // plain Record<string, string>.
            await client.hset(key, { [String(seat)]: JSON.stringify({ v: value }) });
            await client.expire(key, TTL_SECONDS);
        },

        async readInputs<V>(namespace: string, code: number, round: number) {
            const raw = await client.hgetall<Record<string, unknown>>(
                inputsKey(namespace, code, round),
            );
            const out: Record<number, V> = {};
            if (!raw) return out;
            for (const [seatStr, stored] of Object.entries(raw)) {
                const seat = Number(seatStr);
                if (!Number.isInteger(seat)) continue;
                const env = parseStored<{ v: V }>(stored as string);
                if (env && 'v' in env) out[seat] = env.v;
            }
            return out;
        },

        async putPrivate<V>(
            namespace: string,
            code: number,
            round: number,
            seat: number,
            value: V,
        ) {
            const key = privateKey(namespace, code, round);
            // Same envelope discipline as inputs, so a robust parse is unambiguous on read.
            await client.hset(key, { [String(seat)]: JSON.stringify({ v: value }) });
            await client.expire(key, TTL_SECONDS);
        },

        async readPrivate<V>(namespace: string, code: number, round: number, seat: number) {
            const stored = await client.hget<string>(
                privateKey(namespace, code, round),
                String(seat),
            );
            const env = parseStored<{ v: V }>(stored);
            return env && 'v' in env ? env.v : null;
        },
    };
};

// ---------------------------------------------------------------------------
// In-memory backend (dev-only fallback) — survives HMR via globalThis.
// ---------------------------------------------------------------------------

type StateEntry = { doc: StateDoc<unknown>; expiresAt: number };
type InputEntry = { fields: Map<number, unknown>; expiresAt: number };

const globalForLive = globalThis as unknown as {
    __liveStateStore?: Map<string, StateEntry>;
    __liveInputStore?: Map<string, InputEntry>;
    __livePrivateStore?: Map<string, InputEntry>;
};

const createMemoryBackend = (): LiveBackend => {
    const states = (globalForLive.__liveStateStore ??= new Map<string, StateEntry>());
    const inputs = (globalForLive.__liveInputStore ??= new Map<string, InputEntry>());
    const privates = (globalForLive.__livePrivateStore ??= new Map<string, InputEntry>());

    const liveState = (key: string): StateEntry | null => {
        const entry = states.get(key);
        if (!entry) return null;
        if (entry.expiresAt <= Date.now()) {
            states.delete(key);
            return null;
        }
        return entry;
    };

    const bucketFor = (store: Map<string, InputEntry>, key: string): InputEntry => {
        const entry = store.get(key);
        if (entry && entry.expiresAt > Date.now()) return entry;
        const fresh: InputEntry = { fields: new Map(), expiresAt: Date.now() + TTL_SECONDS * 1000 };
        store.set(key, fresh);
        return fresh;
    };
    const liveInputs = (key: string): InputEntry => bucketFor(inputs, key);
    const livePrivate = (key: string): InputEntry => bucketFor(privates, key);

    return {
        async readState<S>(namespace: string, code: number) {
            const entry = liveState(stateKey(namespace, code));
            return (entry?.doc as StateDoc<S>) ?? null;
        },
        async writeState<S>(namespace: string, code: number, doc: StateDoc<S>) {
            states.set(stateKey(namespace, code), {
                doc: doc as StateDoc<unknown>,
                expiresAt: Date.now() + TTL_SECONDS * 1000,
            });
        },
        async clearState(namespace: string, code: number) {
            states.delete(stateKey(namespace, code));
        },
        async putInput<V>(namespace: string, code: number, round: number, seat: number, value: V) {
            liveInputs(inputsKey(namespace, code, round)).fields.set(seat, value);
        },
        async readInputs<V>(namespace: string, code: number, round: number) {
            const entry = liveInputs(inputsKey(namespace, code, round));
            const out: Record<number, V> = {};
            for (const [seat, value] of entry.fields) out[seat] = value as V;
            return out;
        },
        async putPrivate<V>(
            namespace: string,
            code: number,
            round: number,
            seat: number,
            value: V,
        ) {
            livePrivate(privateKey(namespace, code, round)).fields.set(seat, value);
        },
        async readPrivate<V>(namespace: string, code: number, round: number, seat: number) {
            const entry = livePrivate(privateKey(namespace, code, round));
            return entry.fields.has(seat) ? (entry.fields.get(seat) as V) : null;
        },
    };
};

// ---------------------------------------------------------------------------
// Backend resolution (lazy, cached once) — mirrors room-store's strategy.
// ---------------------------------------------------------------------------

let backend: LiveBackend | null = null;

const getBackend = (): LiveBackend => {
    if (backend) return backend;

    const pair = CREDENTIAL_ENV_PAIRS.find(
        ([urlKey, tokenKey]) => process.env[urlKey] && process.env[tokenKey],
    );
    if (pair) {
        backend = createRedisBackend(process.env[pair[0]]!, process.env[pair[1]]!);
        return backend;
    }

    if (process.env.NODE_ENV !== 'production') {
        backend = createMemoryBackend();
        return backend;
    }

    throw new Error(
        'Missing Redis credentials: set UPSTASH_REDIS_REST_URL/TOKEN or ' +
            'UPSTASH_REDIS_KV_REST_API_URL/TOKEN',
    );
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Read the room's public live state document, or null when nothing has been published. */
export const readState = <S>(namespace: string, code: number): Promise<StateDoc<S> | null> =>
    getBackend().readState<S>(namespace, code);

/** Publish the room's public live state (host-authoritative; last write wins). */
export const writeState = <S>(namespace: string, code: number, doc: StateDoc<S>): Promise<void> =>
    getBackend().writeState<S>(namespace, code, doc);

/** Drop the room's public live state (best-effort teardown; inputs expire via TTL). */
export const clearState = (namespace: string, code: number): Promise<void> =>
    getBackend().clearState(namespace, code);

/** Write one seat's input for a round (race-free: each seat owns its own hash field). */
export const putInput = <V>(
    namespace: string,
    code: number,
    round: number,
    seat: number,
    value: V,
): Promise<void> => getBackend().putInput<V>(namespace, code, round, seat, value);

/** Read every seat's input for a round as `{ [seat]: value }`. */
export const readInputs = <V>(
    namespace: string,
    code: number,
    round: number,
): Promise<Record<number, V>> => getBackend().readInputs<V>(namespace, code, round);

/** Write one seat's PRIVATE value for a round (host-authored; read back only by that seat). */
export const putPrivate = <V>(
    namespace: string,
    code: number,
    round: number,
    seat: number,
    value: V,
): Promise<void> => getBackend().putPrivate<V>(namespace, code, round, seat, value);

/** Read one seat's private value for a round, or null when the host hasn't written one. */
export const readPrivate = <V>(
    namespace: string,
    code: number,
    round: number,
    seat: number,
): Promise<V | null> => getBackend().readPrivate<V>(namespace, code, round, seat);
