import { Redis } from '@upstash/redis';

/**
 * Server-side persistence for a room's shared payload, keyed by `(namespace, code)`.
 *
 * This is the game-agnostic generalisation of the original Codenames board store:
 * every game publishes a JSON payload of its own shape under its own namespace
 * (e.g. `codenames:123456`, `spyfall:123456`), so two different games can share the
 * same 6-digit code space without ever colliding.
 *
 * Alongside the payload it holds two capability records (see `tokens.ts`):
 *   - a per-room HOST token (set once at creation) that proves a caller is the host;
 *   - a per-seat token map (a Redis hash) that proves a device owns a given seat.
 * These make "host-authoritative" and "one seat per device" enforceable rather than
 * conventional, so no route ever hands a secret to a device that can't prove it may see it.
 *
 * Backends (resolved lazily, once, on first use):
 *   - Upstash Redis when credentials are present (production and any env with creds).
 *   - An in-memory Map fallback in NON-production when no creds exist, so games run
 *     locally without a live Upstash database. This NEVER activates in production:
 *     with no credentials in production we still throw.
 *
 * The public API stays a handful of plain functions: `readRoom`, `writeRoomIfAbsent`,
 * `deleteRoom`, `claimSeat`, plus the `verifyHost` / `verifySeat` capability checks.
 */

import type { SeatClaim } from './tokens';

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
/** Redis key for a room's per-seat token hash (`{ [seat]: token }`). */
const seatTokensKey = (namespace: string, code: number): string => `${namespace}:${code}:seats`;
/** Redis key for a room's host-capability record (a hash `{ hostToken }`). */
const metaKey = (namespace: string, code: number): string => `${namespace}:${code}:meta`;

/** A cryptographically-random capability token. */
const newToken = (): string => crypto.randomUUID();

/**
 * A non-empty constant-ish string compare for capability checks. Tokens are 128-bit random
 * UUIDs, so timing side-channels are not a practical concern; we only require a present,
 * non-empty, exact match (an absent stored token can never be satisfied).
 */
const tokenMatches = (stored: string | null | undefined, presented: string): boolean =>
    typeof stored === 'string' && stored.length > 0 && stored === presented;

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
     * Atomic create-if-absent. Returns the AUTHORITATIVE payload, whether THIS call actually
     * created the key, and — only when it created it — the freshly-minted host token stored as
     * the room's host capability (atomic with the payload write). A caller that loses the
     * SET-NX race gets `created: false` and `hostToken: null`, so it can neither learn nor
     * overwrite the real host's token.
     */
    writeIfAbsent<T>(
        namespace: string,
        code: number,
        value: T,
    ): Promise<{ value: T; created: boolean; hostToken: string | null }>;
    delete(namespace: string, code: number): Promise<boolean>;
    /**
     * Atomically claim the next seat in a room, returning a 1-based seat number plus the
     * secret token that proves ownership of it. Used by games where every player gets a
     * distinct assignment: each device claims a unique seat and later proves it to read its
     * own sealed slot / submit its own input.
     */
    claimSeat(namespace: string, code: number): Promise<SeatClaim>;
    /** Whether `token` is the host token stored for this room. */
    verifyHost(namespace: string, code: number, token: string): Promise<boolean>;
    /** Whether `token` is the token issued for `seat` in this room. */
    verifySeat(namespace: string, code: number, seat: number, token: string): Promise<boolean>;
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
                    // Mint + store the host capability alongside the freshly-created room.
                    const hostToken = newToken();
                    const meta = metaKey(namespace, code);
                    await client.hset(meta, { hostToken });
                    await client.expire(meta, TTL_SECONDS);
                    return { value, created: true, hostToken };
                }

                // A concurrent writer already created the key — return its value as the
                // authoritative result. Fall back to our candidate only if it vanished
                // (deleted/expired) between the SET and the GET.
                const existing = parseStored<T>(await client.get<T | string>(key));
                return { value: existing ?? value, created: false, hostToken: null };
            } catch (error: unknown) {
                throw wrapError('writing', error);
            }
        },

        async delete(namespace: string, code: number) {
            try {
                // Drop the payload and all its side records together.
                const removed = await client.del(roomKey(namespace, code));
                await client.del(
                    seatKey(namespace, code),
                    seatTokensKey(namespace, code),
                    metaKey(namespace, code),
                );
                return removed > 0;
            } catch (error: unknown) {
                throw wrapError('deleting', error);
            }
        },

        async claimSeat(namespace: string, code: number) {
            try {
                const counter = seatKey(namespace, code);
                // Atomic INCR returns the new value; first claimer gets seat 1.
                const seat = await client.incr(counter);
                await client.expire(counter, TTL_SECONDS);
                // Mint and record this seat's capability token.
                const seatToken = newToken();
                const tokens = seatTokensKey(namespace, code);
                await client.hset(tokens, { [String(seat)]: seatToken });
                await client.expire(tokens, TTL_SECONDS);
                return { seat, token: seatToken };
            } catch (error: unknown) {
                throw wrapError('claiming a seat in', error);
            }
        },

        async verifyHost(namespace: string, code: number, token: string) {
            try {
                const stored = await client.hget<string>(metaKey(namespace, code), 'hostToken');
                return tokenMatches(stored, token);
            } catch (error: unknown) {
                throw wrapError('verifying the host of', error);
            }
        },

        async verifySeat(namespace: string, code: number, seat: number, token: string) {
            try {
                const stored = await client.hget<string>(
                    seatTokensKey(namespace, code),
                    String(seat),
                );
                return tokenMatches(stored, token);
            } catch (error: unknown) {
                throw wrapError('verifying a seat in', error);
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
    __roomSeatTokens?: Map<string, Map<number, string>>;
    __roomHostTokens?: Map<string, string>;
};

const createMemoryStore = (): RoomStore => {
    const map = (globalForStore.__roomMemoryStore ??= new Map<string, MemoryEntry>());
    const seats = (globalForStore.__roomSeatStore ??= new Map<string, number>());
    const seatTokens = (globalForStore.__roomSeatTokens ??= new Map<string, Map<number, string>>());
    const hostTokens = (globalForStore.__roomHostTokens ??= new Map<string, string>());

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
                return { value: existing, created: false, hostToken: null };
            }
            map.set(key, { value, expiresAt: Date.now() + TTL_SECONDS * 1000 });
            const hostToken = newToken();
            hostTokens.set(metaKey(namespace, code), hostToken);
            return { value, created: true, hostToken };
        },

        async delete(namespace: string, code: number) {
            seats.delete(seatKey(namespace, code));
            seatTokens.delete(seatTokensKey(namespace, code));
            hostTokens.delete(metaKey(namespace, code));
            return map.delete(roomKey(namespace, code));
        },

        async claimSeat(namespace: string, code: number) {
            const key = seatKey(namespace, code);
            const seat = (seats.get(key) ?? 0) + 1;
            seats.set(key, seat);
            const seatToken = newToken();
            const tokens = seatTokensKey(namespace, code);
            const forRoom = seatTokens.get(tokens) ?? new Map<number, string>();
            forRoom.set(seat, seatToken);
            seatTokens.set(tokens, forRoom);
            return { seat, token: seatToken };
        },

        async verifyHost(namespace: string, code: number, token: string) {
            return tokenMatches(hostTokens.get(metaKey(namespace, code)), token);
        },

        async verifySeat(namespace: string, code: number, seat: number, token: string) {
            return tokenMatches(seatTokens.get(seatTokensKey(namespace, code))?.get(seat), token);
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

/**
 * Atomically create a room's payload if absent. Returns the authoritative value, `created`
 * (true only when this call created the key — so callers can fire create-once side effects
 * like webhooks exactly once), and the minted `hostToken` when created (else null), to be
 * revealed only to the creator.
 */
export const writeRoomIfAbsent = <T>(
    namespace: string,
    code: number,
    value: T,
): Promise<{ value: T; created: boolean; hostToken: string | null }> =>
    getStore().writeIfAbsent<T>(namespace, code, value);

/** Delete a room (payload + seat counter + seat tokens + host meta). Returns whether a payload was removed. */
export const deleteRoom = (namespace: string, code: number): Promise<boolean> =>
    getStore().delete(namespace, code);

/** Claim the next 1-based seat in a room (atomic), with the token that proves ownership. */
export const claimSeat = (namespace: string, code: number): Promise<SeatClaim> =>
    getStore().claimSeat(namespace, code);

/** Whether `token` is the host token issued when this room was created. */
export const verifyHost = (namespace: string, code: number, token: string): Promise<boolean> =>
    getStore().verifyHost(namespace, code, token);

/** Whether `token` is the token issued for `seat` in this room. */
export const verifySeat = (
    namespace: string,
    code: number,
    seat: number,
    token: string,
): Promise<boolean> => getStore().verifySeat(namespace, code, seat, token);
