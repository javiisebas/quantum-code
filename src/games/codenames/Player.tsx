'use client';

import { fetchRoom } from '@/platform/room/room-client';
import { useHeartbeat } from '@/platform/room/use-presence';
import { JoinScreen } from '@/platform/ui/JoinScreen';
import { Loading } from '@/platform/ui/Loading';
import { useEffect, useState } from 'react';
import { SpyBoard } from './components/SpyBoard';
import type { Board } from './domain';
import { CODENAMES_ID } from './manifest';

type PlayerState = { status: 'loading' } | { status: 'empty' } | { status: 'ready'; board: Board };

/**
 * Codenames player (phone) screen. Given a join code it fetches the shared board and
 * renders the secret colour map; with no code (or an unknown one) it falls back to the
 * join screen. Fetching on the client (rather than the old server component) keeps every
 * game's player view uniform and is the hook the realtime layer plugs into later.
 */
export function CodenamesPlayer({ code }: { code: number | null }) {
    const [state, setState] = useState<PlayerState>(
        code === null ? { status: 'empty' } : { status: 'loading' },
    );

    // Announce presence, like every other game's phone does, so the host's lobby can count the
    // spymasters who have the map before it starts the game. (No-op while `code` is null.)
    useHeartbeat({ game: CODENAMES_ID, code });

    useEffect(() => {
        if (code === null) {
            setState({ status: 'empty' });
            return;
        }

        let cancelled = false;
        setState({ status: 'loading' });

        fetchRoom<Board>(CODENAMES_ID, code)
            .then((board) => {
                if (cancelled) return;
                setState(board?.roles.length ? { status: 'ready', board } : { status: 'empty' });
            })
            .catch(() => {
                if (!cancelled) setState({ status: 'empty' });
            });

        return () => {
            cancelled = true;
        };
    }, [code]);

    if (state.status === 'loading') {
        return <Loading label="Cargando el mapa secreto…" />;
    }

    if (state.status === 'ready') {
        return <SpyBoard roles={state.board.roles} words={state.board.words} />;
    }

    // No code, or a code that resolves to nothing — the one join screen, which explains itself.
    return <JoinScreen initialError={code === null ? null : 'unknown'} />;
}
