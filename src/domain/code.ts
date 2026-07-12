/**
 * Game codes are 6-digit integers (100000-999999 inclusive). They are used both
 * as the shareable "join code" and as the Redis key suffix for a board's roles.
 */

export const MIN_CODE = 100000;
export const MAX_CODE = 999999;

/** Generate a fresh random 6-digit game code. */
export const generateCode = (): number => {
    // 900000 possible values starting at MIN_CODE -> [100000, 999999].
    return Math.floor(Math.random() * (MAX_CODE - MIN_CODE + 1)) + MIN_CODE;
};

/**
 * Parse a game code from untrusted input (query string / route param). Returns the
 * integer only when it is a valid 6-digit code; otherwise null. Rejects non-digit
 * strings, out-of-range values, and non-integers so junk never reaches Redis.
 */
export const parseCode = (raw: string | null): number | null => {
    if (!raw || !/^\d+$/.test(raw)) {
        return null;
    }
    const code = Number(raw);
    if (!Number.isInteger(code) || code < MIN_CODE || code > MAX_CODE) {
        return null;
    }
    return code;
};
