/**
 * Browser HTTP client for the live-game channel (`/api/room/[game]/state` + `/input`).
 *
 * The host publishes public state; phones poll it and submit their own per-seat input.
 * Named distinctly from the server-side `live-store` functions (fetch/publish/submit) to
 * keep the two halves unambiguous. Consumed by the `use-live-room` hooks.
 */

import type { StateDoc } from './live-store';

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
): Promise<void> => {
    const res = await fetch(`/api/room/${encodeURIComponent(game)}/state`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, rev, state }),
    });
    if (!res.ok) throw new Error(`Failed to publish state: ${res.statusText}`);
};

/** POST this seat's input for a round. */
export const submitInput = async <V>(
    game: string,
    code: number,
    round: number,
    seat: number,
    value: V,
): Promise<void> => {
    const res = await fetch(`/api/room/${encodeURIComponent(game)}/input`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, round, seat, value }),
    });
    if (!res.ok) throw new Error(`Failed to submit input: ${res.statusText}`);
};

/** GET every seat's input for a round as `{ [seat]: value }` (host only). */
export const fetchInputs = async <V>(
    game: string,
    code: number,
    round: number,
): Promise<Record<number, V>> => {
    const res = await fetch(
        `/api/room/${encodeURIComponent(game)}/input?code=${code}&round=${round}`,
    );
    if (!res.ok) throw new Error(`Failed to fetch inputs: ${res.statusText}`);
    const { inputs } = (await res.json()) as { inputs: Record<string, V> };
    // JSON object keys are strings; re-key to numbers for callers.
    const out: Record<number, V> = {};
    for (const [seat, value] of Object.entries(inputs ?? {})) out[Number(seat)] = value;
    return out;
};
