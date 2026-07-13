/**
 * Shared primitives for LIVE, phase-based games (Chispas, Sintonía…) built on the
 * live-state channel. These are the equivalents of the per-player games' payload/seat
 * conventions, but for games where phones submit input and everyone watches phases
 * advance.
 */

/**
 * The write-once room payload for a live game. Live games keep no secret in the room
 * payload (all real state lives in the live-store); the payload only has to exist so the
 * 6-digit code resolves, seats can be claimed, and presence works. Every live game shares
 * this shape and validator.
 */
export interface LiveRoomPayload {
    kind: 'live';
}

export const LIVE_ROOM_PAYLOAD: LiveRoomPayload = { kind: 'live' };

/** Validate the minimal live-room payload (`{ kind: 'live' }`). */
export const validateLivePayload = (payload: unknown): boolean =>
    typeof payload === 'object' &&
    payload !== null &&
    (payload as { kind?: unknown }).kind === 'live';

/**
 * The input round reserved for the name roster. Phones write `{ name }` here on join;
 * the host reads it to list joined players. Game rounds use their own (positive) bucket
 * ids, so 0 never collides with gameplay input.
 */
export const ROSTER_ROUND = 0;

/** A joined player: their claimed seat and chosen display name. */
export interface LivePlayer {
    seat: number;
    name: string;
}

/** A single roster submission. */
export interface RosterEntry {
    name: string;
}

/**
 * Build the ordered player list from the raw roster inputs (`{ [seat]: { name } }`),
 * dropping blank names and sorting by seat so the lobby order is stable.
 */
export const rosterFromInputs = (inputs: Record<number, RosterEntry>): LivePlayer[] =>
    Object.entries(inputs)
        .map(([seat, entry]) => ({ seat: Number(seat), name: (entry?.name ?? '').trim() }))
        .filter((player) => Number.isInteger(player.seat) && player.name.length > 0)
        .sort((a, b) => a.seat - b.seat);
