'use client';

import { useEffect, useRef, useState } from 'react';
import { fetchInputs, fetchState, publishState } from './live-client';

/**
 * Client hooks for live, phase-based games — the moving half of the game loop:
 *
 *  - `useLiveState`     (phone + spectator): poll the host's published public state.
 *  - `useLiveInputs`    (host): poll every seat's submissions for a round.
 *  - `usePublishedState`(host): mirror the host's authoritative state to the room so
 *                        phones see each phase change.
 *
 * Polling cadence mirrors presence (~1s): plenty for turn/phase games, and behind these
 * hooks so a later move to SSE/pub-sub touches no screen.
 */

const STATE_POLL_MS = 1_200;
const INPUTS_POLL_MS = 1_000;

/**
 * Phone side: the room's current public state, kept fresh by polling. Re-renders only
 * when the host publishes a new `rev`, so a steady poll doesn't thrash the UI. Returns
 * `null` until the first successful read (render a "waiting" state for null).
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
    const lastRevRef = useRef<number | null>(null);

    useEffect(() => {
        if (code === null) {
            setState(null);
            lastRevRef.current = null;
            return;
        }

        let cancelled = false;
        const poll = async () => {
            try {
                const doc = await fetchState<S>(game, code);
                if (cancelled || !doc) return;
                if (doc.rev !== lastRevRef.current) {
                    lastRevRef.current = doc.rev;
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
 * Host side: every seat's submitted input for `round`, refreshed while `active`. Pass
 * `active: false` (e.g. outside the collecting phase) to stop polling. Returns
 * `{ [seat]: value }`.
 */
export function useLiveInputs<V>({
    game,
    code,
    round,
    active,
    intervalMs = INPUTS_POLL_MS,
}: {
    game: string;
    code: number | null;
    round: number;
    active: boolean;
    intervalMs?: number;
}): Record<number, V> {
    const [inputs, setInputs] = useState<Record<number, V>>({});

    useEffect(() => {
        if (code === null || !active) return;

        let cancelled = false;
        const poll = async () => {
            try {
                const next = await fetchInputs<V>(game, code, round);
                if (!cancelled) setInputs(next);
            } catch {
                /* transient — keep last known inputs */
            }
        };

        void poll();
        const timer = window.setInterval(poll, intervalMs);
        return () => {
            cancelled = true;
            window.clearInterval(timer);
        };
    }, [game, code, round, active, intervalMs]);

    return inputs;
}

/**
 * Host side: publish `state` to the room whenever it changes, so every polling phone sees
 * the new phase. `rev` is stamped with `Date.now()` on each publish, which is monotonic
 * enough for change detection and survives a host reload (a resumed host republishes with
 * a fresh, larger rev). Publishing is fire-and-forget; a failed write retries on the next
 * state change. Pass `enabled: false` to hold publishing (e.g. before the game starts).
 */
export function usePublishedState<S>({
    game,
    code,
    state,
    enabled = true,
}: {
    game: string;
    code: number | null;
    state: S | null;
    enabled?: boolean;
}): void {
    useEffect(() => {
        if (code === null || !enabled || state === null) return;
        void publishState(game, code, Date.now(), state).catch(() => {});
    }, [game, code, state, enabled]);
}
