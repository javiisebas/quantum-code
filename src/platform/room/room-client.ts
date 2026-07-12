/**
 * Thin browser HTTP client for the generic room endpoint `/api/room/[game]`.
 *
 * Every game reads/creates/deletes its shared payload the same way; only the
 * `game` id and the payload shape `T` differ. The create path goes through POST,
 * which performs an atomic SET NX server-side, so there is no client-side
 * get-then-create race.
 */

const roomUrl = (game: string, code: number): string =>
    `/api/room/${encodeURIComponent(game)}?code=${code}`;

/** GET the payload for a code, or null when none exists yet. */
export const fetchRoom = async <T>(game: string, code: number): Promise<T | null> => {
    const response = await fetch(roomUrl(game, code));
    if (!response.ok) {
        throw new Error(`Failed to fetch room: ${response.statusText}`);
    }
    // The endpoint returns the payload object, or `null` when the code is unknown.
    return (await response.json()) as T | null;
};

/**
 * POST a candidate payload for a code. The server creates it atomically if absent
 * and responds with the AUTHORITATIVE payload (the pre-existing one if another
 * client already created it). Returns whatever the server considers canonical.
 */
export const createRoom = async <T>(game: string, code: number, payload: T): Promise<T> => {
    const response = await fetch(`/api/room/${encodeURIComponent(game)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, payload }),
    });

    if (!response.ok) {
        throw new Error(`Failed to save room: ${response.statusText}`);
    }

    return (await response.json()) as T;
};

/** DELETE the room for a code. Treats a 404 (already gone) as success. */
export const deleteRoom = async (game: string, code: number): Promise<void> => {
    const response = await fetch(roomUrl(game, code), { method: 'DELETE' });

    if (response.status === 404) {
        return;
    }

    if (!response.ok) {
        throw new Error(`Failed to delete room: ${response.statusText}`);
    }
};

/** Claim the next 1-based seat in a room (for per-player-secret games). */
export const claimSeat = async (game: string, code: number): Promise<number> => {
    const response = await fetch(`/api/room/${encodeURIComponent(game)}/seat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
    });

    if (!response.ok) {
        throw new Error(`Failed to claim seat: ${response.statusText}`);
    }

    const { seat } = (await response.json()) as { seat: number };
    return seat;
};
