import { Board } from '@/domain';
import { Redis } from '@upstash/redis';

/**
 * Server-side persistence for a game board (roles + words), keyed by game code.
 *
 * Backends (resolved lazily, once, on first use):
 *   - Upstash Redis when credentials are present (production and any env with creds).
 *   - An in-memory Map fallback in NON-production when no creds exist, so the game
 *     runs locally without a live Upstash database. This NEVER activates in
 *     production: with no creds in production we still throw.
 *
 * The public API is three plain functions: readBoard, writeBoardIfAbsent, deleteBoard.
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

const getKey = (code: number): string => `board:${code}`;

/** Normalize a stored payload (Upstash auto-deserializes JSON; be robust to raw strings). */
const parseStored = (data: Board | string | null): Board | null => {
    if (!data) {
        return null;
    }
    if (typeof data === 'string') {
        return JSON.parse(data) as Board;
    }
    return data;
};

/**
 * Common backend contract. Both the Redis and in-memory implementations satisfy it,
 * so the exported functions don't care which one is active.
 */
interface BoardStore {
    readBoard(code: number): Promise<Board | null>;
    /**
     * Atomic create-if-absent. Returns the AUTHORITATIVE board: the passed `board`
     * when this call created the key, or the pre-existing board when the key already
     * existed (i.e. a concurrent writer won the race).
     */
    writeBoardIfAbsent(code: number, board: Board): Promise<Board>;
    deleteBoard(code: number): Promise<boolean>;
}

// ---------------------------------------------------------------------------
// Redis-backed store
// ---------------------------------------------------------------------------

const createRedisStore = (url: string, token: string): BoardStore => {
    const client = new Redis({ url, token });

    return {
        async readBoard(code) {
            try {
                const data = await client.get<Board | string>(getKey(code));
                return parseStored(data);
            } catch (error: unknown) {
                throw wrapError('reading', error);
            }
        },

        async writeBoardIfAbsent(code, board) {
            try {
                const key = getKey(code);
                // Atomic SET NX EX: "OK" when created, null when the key already existed.
                // This closes the read-then-create race the old getOrCreate had.
                const result = await client.set(key, JSON.stringify(board), {
                    nx: true,
                    ex: TTL_SECONDS,
                });

                if (result === 'OK') {
                    return board;
                }

                // A concurrent writer already created the key — return its value as the
                // authoritative result. Fall back to our candidate only if it vanished
                // (deleted/expired) between the SET and the GET.
                const existing = parseStored(await client.get<Board | string>(key));
                return existing ?? board;
            } catch (error: unknown) {
                throw wrapError('writing', error);
            }
        },

        async deleteBoard(code) {
            try {
                // redis.del returns the number of keys removed.
                return (await client.del(getKey(code))) > 0;
            } catch (error: unknown) {
                throw wrapError('deleting', error);
            }
        },
    };
};

const wrapError = (action: 'reading' | 'writing' | 'deleting', error: unknown): Error => {
    const detail = error instanceof Error ? error.message : 'unknown error';
    return new Error(`Error ${action} board from Redis: ${detail}`);
};

// ---------------------------------------------------------------------------
// In-memory store (dev-only fallback)
// ---------------------------------------------------------------------------

type MemoryEntry = { board: Board; expiresAt: number };

// Stored on globalThis so the map survives Next.js HMR module reloads in dev.
const globalForStore = globalThis as unknown as {
    __boardMemoryStore?: Map<string, MemoryEntry>;
};

const createMemoryStore = (): BoardStore => {
    const map = (globalForStore.__boardMemoryStore ??= new Map<string, MemoryEntry>());

    const readLive = (key: string): Board | null => {
        const entry = map.get(key);
        if (!entry) {
            return null;
        }
        if (entry.expiresAt <= Date.now()) {
            map.delete(key);
            return null;
        }
        return entry.board;
    };

    return {
        async readBoard(code) {
            return readLive(getKey(code));
        },

        async writeBoardIfAbsent(code, board) {
            const key = getKey(code);
            const existing = readLive(key);
            if (existing) {
                return existing;
            }
            map.set(key, { board, expiresAt: Date.now() + TTL_SECONDS * 1000 });
            return board;
        },

        async deleteBoard(code) {
            return map.delete(getKey(code));
        },
    };
};

// ---------------------------------------------------------------------------
// Backend resolution (lazy, cached once)
// ---------------------------------------------------------------------------

let store: BoardStore | null = null;

const getStore = (): BoardStore => {
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
            '[board-store] No Redis credentials found — using in-memory store (dev only). ' +
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

export const readBoard = (code: number): Promise<Board | null> => getStore().readBoard(code);

export const writeBoardIfAbsent = (code: number, board: Board): Promise<Board> =>
    getStore().writeBoardIfAbsent(code, board);

export const deleteBoard = (code: number): Promise<boolean> => getStore().deleteBoard(code);
