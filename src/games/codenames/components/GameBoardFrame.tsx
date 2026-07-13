'use client';

import { useGame } from '@/games/codenames/GameContext';
import { Loading } from '@/platform/ui/Loading';
import { RoomError } from '@/platform/ui/RoomError';
import { ChildrenProps } from '@/platform/util/children';
import { FC } from 'react';
import { GameBoardLost } from './GameBoardLost';
import { GameBoardScore } from './GameBoardScore';
import { GameBoardWon } from './GameBoardWon';
import { GameResultPanel } from './GameResultPanel';

export const GameBoardFrame: FC<ChildrenProps> = ({ children }) => {
    const { loading, error, retry } = useGame();

    // Role loading failed (e.g. the API/Redis is down) — never leave the board stuck on a
    // spinner. The shared room-error state offers the retry *and* a way out, so a board that
    // can't load is no longer a dead end.
    if (error) {
        return <RoomError title="Algo ha ido mal" message={error} onRetry={retry} />;
    }

    if (loading) {
        return <Loading label="Preparando la partida…" />;
    }

    return (
        <div className="relative isolate flex h-screen w-screen items-center justify-center">
            <GameBoardLost />
            <GameBoardWon />
            <GameBoardScore />

            <div className="w-5/6 h-5/6 flex items-center justify-center flex-col">{children}</div>

            <GameResultPanel />
        </div>
    );
};
