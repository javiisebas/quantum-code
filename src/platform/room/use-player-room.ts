'use client';

import { LocalStorageHelper } from '@/platform/persistence/local-storage';
import { useEffect, useState } from 'react';
import { claimSeat as apiClaimSeat, fetchRoom } from './room-client';
import type { SeatClaim } from './tokens';

/**
 * Player-side room access for phone screens. Fetches the room's shared payload for a
 * code and, for per-player-secret games, claims a stable seat:
 *
 *  - `withSeat: true` → claim a 1-based seat once and persist it (with the seat token that
 *    proves ownership) in localStorage, keyed by `(game, code)`, so a reload keeps the SAME
 *    seat and token instead of consuming a new one. This is what lets Spyfall/Undercover give
 *    each phone its own card and lets a live phone submit input / read its private slice.
 *  - `withSeat: false` (default) → shared-secret games (Codenames): every phone reads the
 *    same payload, no seat needed.
 *
 * The seat token rides the exact same localStorage entry as the seat number, so its lifecycle
 * is unchanged: clearing storage forfeits both and re-claims a fresh seat, exactly as before.
 */
export interface PlayerRoom<T> {
    status: 'loading' | 'empty' | 'ready';
    payload: T | null;
    /** 1-based seat for per-player games; null for shared-secret games. */
    seat: number | null;
    /** The token proving ownership of `seat`; null for shared-secret games. */
    seatToken: string | null;
}

const seatStorageKey = (game: string, code: number) => `quantum:seat:${game}:${code}`;

/** A stored value is a usable claim only when it carries both a seat and a token. */
const isSeatClaim = (value: unknown): value is SeatClaim =>
    typeof value === 'object' &&
    value !== null &&
    typeof (value as SeatClaim).seat === 'number' &&
    typeof (value as SeatClaim).token === 'string' &&
    (value as SeatClaim).token.length > 0;

export function usePlayerRoom<T>({
    game,
    code,
    withSeat = false,
}: {
    game: string;
    code: number | null;
    withSeat?: boolean;
}): PlayerRoom<T> {
    const [status, setStatus] = useState<'loading' | 'empty' | 'ready'>(
        code === null ? 'empty' : 'loading',
    );
    const [payload, setPayload] = useState<T | null>(null);
    const [seat, setSeat] = useState<number | null>(null);
    const [seatToken, setSeatToken] = useState<string | null>(null);

    useEffect(() => {
        if (code === null) {
            setStatus('empty');
            setPayload(null);
            setSeat(null);
            setSeatToken(null);
            return;
        }

        let cancelled = false;
        setStatus('loading');

        (async () => {
            try {
                const data = await fetchRoom<T>(game, code);
                if (cancelled) return;
                if (!data) {
                    setStatus('empty');
                    return;
                }

                let claim: SeatClaim | null = null;
                if (withSeat) {
                    const key = seatStorageKey(game, code);
                    const stored = LocalStorageHelper.getLocalStorageItem<unknown>(key);
                    if (isSeatClaim(stored)) {
                        claim = stored;
                    } else {
                        // No claim yet (or a stale pre-token entry) — claim a fresh seat+token.
                        claim = await apiClaimSeat(game, code);
                        LocalStorageHelper.setLocalStorageItem(key, claim);
                    }
                    if (cancelled) return;
                }

                setPayload(data);
                setSeat(claim?.seat ?? null);
                setSeatToken(claim?.token ?? null);
                setStatus('ready');
            } catch {
                if (!cancelled) setStatus('empty');
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [game, code, withSeat]);

    return { status, payload, seat, seatToken };
}
