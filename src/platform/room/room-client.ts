/**
 * Thin browser HTTP client for the generic room endpoint `/api/room/[game]`.
 *
 * Every game reads/creates/deletes its shared payload the same way; only the
 * `game` id and the payload shape `T` differ. The create path goes through POST,
 * which performs an atomic SET NX server-side, so there is no client-side
 * get-then-create race.
 */

import { SEAT_TOKEN_HEADER, type RoomCreation, type SeatClaim } from './tokens';

const roomUrl = (game: string, code: number): string =>
    `/api/room/${encodeURIComponent(game)}?code=${code}`;

/**
 * GET the payload for a code, or null when none exists yet. For per-player-secret games, pass
 * this device's `seat` + `seatToken`: the server then returns ONLY this seat's projected slice
 * (never the whole payload). Shared/live games ignore them and return the full payload.
 */
export const fetchRoom = async <T>(
    game: string,
    code: number,
    seat?: number,
    seatToken?: string,
): Promise<T | null> => {
    const url = seat != null ? `${roomUrl(game, code)}&seat=${seat}` : roomUrl(game, code);
    const response = await fetch(
        url,
        seatToken ? { headers: { [SEAT_TOKEN_HEADER]: seatToken } } : undefined,
    );
    if (!response.ok) {
        throw new Error(`Failed to fetch room: ${response.statusText}`);
    }
    // The endpoint returns the payload/projection object, or `null` when the code is unknown.
    return (await response.json()) as T | null;
};

const postRoom = async <T>(game: string, body: object): Promise<RoomCreation<T>> => {
    const response = await fetch(`/api/room/${encodeURIComponent(game)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        throw new Error(`Failed to save room: ${response.statusText}`);
    }

    return (await response.json()) as RoomCreation<T>;
};

/**
 * OPEN a room: post the payload and let the SERVER mint the join code. The code has to be
 * allocated server-side because only the store can see every game's reservations, and the whole
 * join flow now rests on six digits naming exactly one room across the arcade.
 *
 * Returns `{ code, value, hostToken }` — the token proving this caller is the host.
 */
export const openRoom = <T>(game: string, payload: T): Promise<RoomCreation<T>> =>
    postRoom<T>(game, { payload });

/**
 * RESUME a room at a code the host already holds (it reloaded and read the code back from
 * localStorage). Re-ensures both the room and its code reservation, since either may have
 * lapsed past its TTL. The room is created-if-absent, so `hostToken` comes back null when the
 * room was still there — the caller keeps the token it already persisted.
 */
export const resumeRoom = <T>(game: string, code: number, payload: T): Promise<RoomCreation<T>> =>
    postRoom<T>(game, { code, payload });

/**
 * Resolve a join code to the game that owns it, or null when no live room has that code.
 * This is what lets a player type six digits and land in the right game without picking it.
 */
export const resolveJoinCode = async (
    code: number | string,
): Promise<{ game: string; name: string; emoji: string } | null> => {
    const response = await fetch(`/api/join/${encodeURIComponent(String(code))}`);

    if (response.status === 404 || response.status === 400) {
        return null;
    }

    if (!response.ok) {
        throw new Error(`Failed to resolve code: ${response.statusText}`);
    }

    return (await response.json()) as { game: string; name: string; emoji: string };
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

/**
 * Claim the next 1-based seat in a room (for per-player-secret and live games). Returns the
 * seat plus the secret token that proves ownership of it — the caller persists both together
 * and presents the token to submit that seat's input or read its sealed/private data.
 */
export const claimSeat = async (game: string, code: number): Promise<SeatClaim> => {
    const response = await fetch(`/api/room/${encodeURIComponent(game)}/seat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
    });

    if (!response.ok) {
        throw new Error(`Failed to claim seat: ${response.statusText}`);
    }

    return (await response.json()) as SeatClaim;
};
