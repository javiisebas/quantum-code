'use client';

import { useEffect, useRef, useState } from 'react';
import {
    fetchInputs,
    fetchPrivate,
    fetchState,
    publishPrivate,
    publishState,
    RoomAuthError,
} from './live-client';

/**
 * Client hooks for live, phase-based games — the moving half of the game loop:
 *
 *  - `useLiveState`      (phone + spectator): poll the host's published PUBLIC state.
 *  - `useLiveInputs`     (host): poll every seat's submissions for a round.
 *  - `usePublishedState` (host): mirror the host's authoritative state to the room so
 *                         phones see each phase change.
 *  - `usePrivateState`   (phone): poll THIS seat's own private slice (a secret shown to
 *                         exactly one player, e.g. Sintonía's target for the psychic).
 *  - `usePublishedPrivate`(host): write one seat's private slice when it changes.
 *
 * Host calls carry the room's host token; a phone's private read carries its seat token, so a
 * secret never rides the public state document. Polling cadence mirrors presence (~1s) and is
 * behind these hooks so a later move to SSE/pub-sub touches no screen.
 */

const STATE_POLL_MS = 1_200;
const INPUTS_POLL_MS = 1_000;
const PRIVATE_POLL_MS = 1_200;

/**
 * Phone side: the room's current public state, kept fresh by polling. Re-renders only when
 * the host publishes a new `rev`. Returns `null` until the first successful read.
 */
export function useLiveState<S>({
    game,
    code,
    intervalMs = STATE_POLL_MS,
}: {
    game: string;
    code: number | null;
    intervalMs?: number;
}): S | null {
    const [state, setState] = useState<S | null>(null);

    useEffect(() => {
        if (code === null) {
            setState(null);
            return;
        }

        let cancelled = false;
        let lastRev: number | null = null;
        const poll = async () => {
            try {
                const doc = await fetchState<S>(game, code);
                if (cancelled || !doc) return;
                if (doc.rev !== lastRev) {
                    lastRev = doc.rev;
                    setState(doc.state);
                }
            } catch {
                /* transient — keep the last known state */
            }
        };

        void poll();
        const timer = window.setInterval(poll, intervalMs);
        return () => {
            cancelled = true;
            window.clearInterval(timer);
        };
    }, [game, code, intervalMs]);

    return state;
}

/**
 * Host side: every seat's submitted input for `round`, refreshed while `active`. Requires the
 * host token (reading all inputs is host-only). Returns `{ [seat]: value }`.
 */
export function useLiveInputs<V>({
    game,
    code,
    round,
    active,
    hostToken,
    intervalMs = INPUTS_POLL_MS,
    onUnauthorized,
}: {
    game: string;
    code: number | null;
    round: number;
    active: boolean;
    hostToken: string | null;
    intervalMs?: number;
    /**
     * Called once if the server REJECTS this host token (see `RoomAuthError`). Every other
     * failure is treated as transient and swallowed, but this one is terminal — without a way
     * to hear about it, a host whose capability died sits watching an empty roster forever.
     */
    onUnauthorized?: () => void;
}): Record<number, V> {
    const [inputs, setInputs] = useState<Record<number, V>>({});

    // Kept in a ref so passing an inline handler doesn't restart the poll loop on every render.
    const onUnauthorizedRef = useRef(onUnauthorized);
    onUnauthorizedRef.current = onUnauthorized;

    useEffect(() => {
        // Reset immediately so a round/code change never serves the previous bucket's data
        // for one poll interval (which would briefly mis-report who has answered).
        setInputs({});
        if (code === null || !active || !hostToken) return;

        let cancelled = false;
        let stopped = false;
        const poll = async () => {
            if (stopped) return;
            try {
                const next = await fetchInputs<V>(game, code, round, hostToken);
                if (!cancelled) setInputs(next);
            } catch (error: unknown) {
                if (error instanceof RoomAuthError) {
                    // Terminal: this token will never be accepted for this room. Stop hammering
                    // the endpoint and hand the decision up (the lobby opens a fresh room).
                    stopped = true;
                    if (!cancelled) onUnauthorizedRef.current?.();
                }
                /* anything else is transient — keep the last known inputs */
            }
        };

        void poll();
        const timer = window.setInterval(poll, intervalMs);
        return () => {
            cancelled = true;
            window.clearInterval(timer);
        };
    }, [game, code, round, active, hostToken, intervalMs]);

    return inputs;
}

/**
 * Host side: publish `state` to the room whenever it changes, so every polling phone sees the
 * new phase. `rev` is stamped with `Date.now()` on each publish (monotonic enough for change
 * detection and survives a host reload). Requires the host token. Fire-and-forget; a failed
 * write retries on the next state change. Pass `enabled: false` to hold publishing.
 */
export function usePublishedState<S>({
    game,
    code,
    state,
    hostToken,
    enabled = true,
}: {
    game: string;
    code: number | null;
    state: S | null;
    hostToken: string | null;
    enabled?: boolean;
}): void {
    useEffect(() => {
        if (code === null || !enabled || state === null || !hostToken) return;
        void publishState(game, code, Date.now(), state, hostToken).catch(() => {});
    }, [game, code, state, hostToken, enabled]);
}

/**
 * Phone side: poll THIS seat's own private slice for a round (proving ownership with the seat
 * token), e.g. the psychic reading Sintonía's secret target. Returns `null` until the host has
 * written one; resets when the round/seat changes so a new round re-fetches. Pass
 * `active: false` to stop polling (e.g. when this phone isn't the one the secret is for).
 */
export function usePrivateState<V>({
    game,
    code,
    round,
    seat,
    seatToken,
    active = true,
    intervalMs = PRIVATE_POLL_MS,
}: {
    game: string;
    code: number | null;
    round: number;
    seat: number | null;
    seatToken: string | null;
    active?: boolean;
    intervalMs?: number;
}): V | null {
    const [value, setValue] = useState<V | null>(null);

    useEffect(() => {
        setValue(null);
        if (code === null || seat === null || !seatToken || !active) return;

        let cancelled = false;
        const poll = async () => {
            try {
                const next = await fetchPrivate<V>(game, code, round, seat, seatToken);
                if (!cancelled && next !== null) setValue(next);
            } catch {
                /* transient — keep the last known value */
            }
        };

        void poll();
        const timer = window.setInterval(poll, intervalMs);
        return () => {
            cancelled = true;
            window.clearInterval(timer);
        };
    }, [game, code, round, seat, seatToken, active, intervalMs]);

    return value;
}

/**
 * Host side: publish one seat's private slice (`value` for `seat`, `round`) whenever it
 * changes, so exactly that phone can read it via `usePrivateState`. Requires the host token.
 * Fire-and-forget. Pass `enabled: false` (or a null value/seat) to hold publishing.
 */
export function usePublishedPrivate<V>({
    game,
    code,
    round,
    seat,
    value,
    hostToken,
    enabled = true,
}: {
    game: string;
    code: number | null;
    round: number;
    seat: number | null;
    value: V | null;
    hostToken: string | null;
    enabled?: boolean;
}): void {
    useEffect(() => {
        if (code === null || seat === null || value === null || !enabled || !hostToken) return;
        void publishPrivate(game, code, round, seat, value, hostToken).catch(() => {});
    }, [game, code, round, seat, value, hostToken, enabled]);
}
