'use client';

import { LocalStorageHelper } from '@/platform/persistence/local-storage';
import { useEffect, useState } from 'react';

/**
 * Presence hooks — the client half of the room "life" layer.
 *
 *  - `useHeartbeat` (phone side): pings the room every few seconds so the host sees
 *    this player as connected. A stable per-device id keeps reconnects/reloads from
 *    inflating the count.
 *  - `useLiveCount` (host side): polls the active-phone count so the lobby updates in
 *    near real time as players join or leave.
 *
 * Polling is deliberately behind these hooks: the transport can move to SSE/pub-sub
 * later without any screen changing.
 */

const HEARTBEAT_MS = 5_000;
const COUNT_POLL_MS = 3_000;
const PLAYER_ID_KEY = 'quantum:player-id';

/** A stable id for this device, created once and persisted. */
const getPlayerId = (): string => {
    const existing = LocalStorageHelper.getLocalStorageItem<string>(PLAYER_ID_KEY);
    if (existing) return existing;
    const id =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID()
            : `p-${Math.random().toString(36).slice(2)}`;
    LocalStorageHelper.setLocalStorageItem(PLAYER_ID_KEY, id);
    return id;
};

/** Phone side: announce this player's presence in the room while mounted. */
export function useHeartbeat({ game, code }: { game: string; code: number | null }): void {
    useEffect(() => {
        if (code === null) return;
        const playerId = getPlayerId();

        const ping = () => {
            void fetch(`/api/room/${game}/presence`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, playerId }),
                keepalive: true,
            }).catch(() => {});
        };

        ping();
        const timer = window.setInterval(ping, HEARTBEAT_MS);
        return () => window.clearInterval(timer);
    }, [game, code]);
}

/** Host side: the number of phones currently connected to the room. */
export function useLiveCount({ game, code }: { game: string; code: number | null }): number {
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (code === null) {
            setCount(0);
            return;
        }

        let cancelled = false;
        const poll = async () => {
            try {
                const res = await fetch(`/api/room/${game}/presence?code=${code}`);
                if (!res.ok) return;
                const { count: c } = (await res.json()) as { count: number };
                if (!cancelled) setCount(c);
            } catch {
                /* transient — keep the last known count */
            }
        };

        void poll();
        const timer = window.setInterval(poll, COUNT_POLL_MS);
        return () => {
            cancelled = true;
            window.clearInterval(timer);
        };
    }, [game, code]);

    return count;
}
