'use client';

import { JoinForm } from '@/games/_shared/JoinForm';
import { fetchRoom } from '@/platform/room/room-client';
import { Spinner } from '@heroui/react';
import { useEffect, useState } from 'react';
import { SpyBoard } from './components/SpyBoard';
import type { Board } from './domain';
import { CODENAMES_ID } from './manifest';
import { codenamesManifest } from './manifest';

type PlayerState =
    | { status: 'loading' }
    | { status: 'empty' }
    | { status: 'ready'; board: Board };

/**
 * Codenames player (phone) screen. Given a join code it fetches the shared board and
 * renders the secret colour map; with no code (or an unknown one) it falls back to the
 * join form. Fetching on the client (rather than the old server component) keeps every
 * game's player view uniform and is the hook the realtime layer plugs into later.
 */
export function CodenamesPlayer({ code }: { code: number | null }) {
    const [state, setState] = useState<PlayerState>(
        code === null ? { status: 'empty' } : { status: 'loading' },
    );

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
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Spinner color="secondary" label="Cargando el mapa secreto…" />
            </div>
        );
    }

    if (state.status === 'ready') {
        return <SpyBoard roles={state.board.roles} words={state.board.words} />;
    }

    return <JoinForm game={CODENAMES_ID} gameName={codenamesManifest.name} />;
}
