/**
 * Browser HTTP client for the live-game channel (`/api/room/[game]/state` + `/input` +
 * `/private`).
 *
 * The host publishes public state and reads every seat's input; phones poll the public state
 * and submit their own per-seat input. Host-only calls carry the room's host token; a phone's
 * calls carry its seat token, so the server hands each secret only to who may see it. Named
 * distinctly from the server-side `live-store` functions to keep the two halves unambiguous.
 * Consumed by the `use-live-room` hooks.
 */

import type { StateDoc } from './live-store';
import { HOST_TOKEN_HEADER, SEAT_TOKEN_HEADER } from './tokens';

/**
 * The capability presented was rejected (401/403). Unlike a dropped request this is TERMINAL:
 * polling again with the same token will fail forever, so callers must distinguish it from the
 * transient failures they are right to swallow.
 *
 * It happens for real: a room outlives its 7-day TTL, the host reloads and re-creates it, and
 * the server mints a NEW host capability — any token persisted from the old room is now dead.
 * Left undetected, the host sits in front of a lobby that never fills, with no error and no way
 * out, while the room it is polling quietly belongs to nobody.
 */
export class RoomAuthError extends Error {
    constructor(message = 'Room capability rejected') {
        super(message);
        this.name = 'RoomAuthError';
    }
}

const isAuthFailure = (status: number): boolean => status === 401 || status === 403;

/** GET the room's public live state, or null when nothing has been published yet. */
export const fetchState = async <S>(game: string, code: number): Promise<StateDoc<S> | null> => {
    const res = await fetch(`/api/room/${encodeURIComponent(game)}/state?code=${code}`);
    if (!res.ok) throw new Error(`Failed to fetch state: ${res.statusText}`);
    return (await res.json()) as StateDoc<S> | null;
};

/** PUT the room's public live state (host only). Fire-and-forget friendly. */
export const publishState = async <S>(
    game: string,
    code: number,
    rev: number,
    state: S,
    hostToken: string,
): Promise<void> => {
    const res = await fetch(`/api/room/${encodeURIComponent(game)}/state`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', [HOST_TOKEN_HEADER]: hostToken },
        body: JSON.stringify({ code, rev, state }),
    });
    if (!res.ok) throw new Error(`Failed to publish state: ${res.statusText}`);
};

/** POST this seat's input for a round (proves seat ownership with the seat token). */
export const submitInput = async <V>(
    game: string,
    code: number,
    round: number,
    seat: number,
    value: V,
    seatToken: string,
): Promise<void> => {
    const res = await fetch(`/api/room/${encodeURIComponent(game)}/input`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', [SEAT_TOKEN_HEADER]: seatToken },
        body: JSON.stringify({ code, round, seat, value }),
    });
    if (!res.ok) throw new Error(`Failed to submit input: ${res.statusText}`);
};

/** GET every seat's input for a round as `{ [seat]: value }` (host only). */
export const fetchInputs = async <V>(
    game: string,
    code: number,
    round: number,
    hostToken: string,
): Promise<Record<number, V>> => {
    const res = await fetch(
        `/api/room/${encodeURIComponent(game)}/input?code=${code}&round=${round}`,
        { headers: { [HOST_TOKEN_HEADER]: hostToken } },
    );
    if (isAuthFailure(res.status)) throw new RoomAuthError('Host token rejected');
    if (!res.ok) throw new Error(`Failed to fetch inputs: ${res.statusText}`);
    const { inputs } = (await res.json()) as { inputs: Record<string, V> };
    // JSON object keys are strings; re-key to numbers for callers.
    const out: Record<number, V> = {};
    for (const [seat, value] of Object.entries(inputs ?? {})) out[Number(seat)] = value;
    return out;
};

/** PUT one seat's PRIVATE value for a round (host only) — a secret shown to exactly one phone. */
export const publishPrivate = async <V>(
    game: string,
    code: number,
    round: number,
    seat: number,
    value: V,
    hostToken: string,
): Promise<void> => {
    const res = await fetch(`/api/room/${encodeURIComponent(game)}/private`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', [HOST_TOKEN_HEADER]: hostToken },
        body: JSON.stringify({ code, round, seat, value }),
    });
    if (!res.ok) throw new Error(`Failed to publish private: ${res.statusText}`);
};

/** GET this seat's own private value for a round (proves seat ownership), or null. */
export const fetchPrivate = async <V>(
    game: string,
    code: number,
    round: number,
    seat: number,
    seatToken: string,
): Promise<V | null> => {
    const res = await fetch(
        `/api/room/${encodeURIComponent(game)}/private?code=${code}&round=${round}&seat=${seat}`,
        { headers: { [SEAT_TOKEN_HEADER]: seatToken } },
    );
    if (!res.ok) throw new Error(`Failed to fetch private: ${res.statusText}`);
    const { value } = (await res.json()) as { value: V | null };
    return value ?? null;
};
