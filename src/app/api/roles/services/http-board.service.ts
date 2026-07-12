import { Board } from '@/domain';

/**
 * Thin HTTP client for the /api/roles endpoint. Used by the browser to read/create/
 * delete a game board (roles + words). The create path goes through POST, which
 * performs an atomic SET NX server-side, so there is no client-side get-then-create
 * race.
 */

/** GET the board for a code, or null when none exists yet. */
export const fetchBoard = async (code: number): Promise<Board | null> => {
    const response = await fetch(`/api/roles?code=${code}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch board: ${response.statusText}`);
    }
    // The endpoint returns the board object, or `null` when the code is unknown.
    return (await response.json()) as Board | null;
};

/**
 * POST a candidate board for a code. The server creates it atomically if absent and
 * responds with the AUTHORITATIVE board (the pre-existing one if another client
 * already created it). Returns whatever the server considers canonical.
 */
export const createBoard = async (code: number, board: Board): Promise<Board> => {
    const response = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, roles: board.roles, words: board.words }),
    });

    if (!response.ok) {
        throw new Error(`Failed to save board: ${response.statusText}`);
    }

    return (await response.json()) as Board;
};

/** DELETE the board for a code. Treats a 404 (already gone) as success. */
export const deleteBoard = async (code: number): Promise<void> => {
    const response = await fetch(`/api/roles?code=${code}`, { method: 'DELETE' });

    if (response.status === 404) {
        return;
    }

    if (!response.ok) {
        throw new Error(`Failed to delete board: ${response.statusText}`);
    }
};
