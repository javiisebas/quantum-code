'use client';

import { LocalStorageHelper } from '@/platform/persistence/local-storage';
import { useEffect, useState } from 'react';
import { claimSeat as apiClaimSeat, fetchRoom } from './room-client';

/**
 * Player-side room access for phone screens. Fetches the room's shared payload for a
 * code and, for per-player-secret games, claims a stable seat:
 *
 *  - `withSeat: true` → claim a 1-based seat once and persist it in localStorage,
 *    keyed by `(game, code)`, so a reload keeps the SAME seat instead of consuming a
 *    new one. This is what lets Spyfall/Undercover give each phone its own card.
 *  - `withSeat: false` (default) → shared-secret games (Codenames): every phone reads
 *    the same payload, no seat needed.
 */
export interface PlayerRoom<T> {
    status: 'loading' | 'empty' | 'ready';
    payload: T | null;
    /** 1-based seat for per-player games; null for shared-secret games. */
    seat: number | null;
}

const seatStorageKey = (game: string, code: number) => `quantum:seat:${game}:${code}`;

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

    useEffect(() => {
        if (code === null) {
            setStatus('empty');
            setPayload(null);
            setSeat(null);
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

                let mySeat: number | null = null;
                if (withSeat) {
                    const key = seatStorageKey(game, code);
                    const stored = LocalStorageHelper.getLocalStorageItem<number>(key);
                    if (stored) {
                        mySeat = stored;
                    } else {
                        mySeat = await apiClaimSeat(game, code);
                        LocalStorageHelper.setLocalStorageItem(key, mySeat);
                    }
                    if (cancelled) return;
                }

                setPayload(data);
                setSeat(mySeat);
                setStatus('ready');
            } catch {
                if (!cancelled) setStatus('empty');
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [game, code, withSeat]);

    return { status, payload, seat };
}
