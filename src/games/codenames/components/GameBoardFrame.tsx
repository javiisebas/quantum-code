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

/**
 * The one screen in the arcade that is deliberately NOT a `<Screen>`: a 5×5 board on a TV is not
 * a page with a content column, it is a board, and it wants every pixel. So it owns the viewport
 * and carries its chrome as floating docks (the score HUD above, the menu below) instead of a
 * `<TopBar>` — those docks already hold the same three things a top bar does: the way home, the
 * game's rules, and this screen's actions.
 *
 * What it does NOT get to do differently is the viewport contract itself. Like every `<Screen>`,
 * it is `h-dvh` (not `h-screen`), so mobile browser chrome shrinking the viewport shrinks the
 * board with it rather than pushing the dock under the address bar; and `w-full` (not `w-screen`,
 * which ignores the scrollbar and overflows sideways).
 */
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
        <div className="relative isolate flex h-dvh w-full items-center justify-center overflow-hidden">
            <GameBoardLost />
            <GameBoardWon />
            <GameBoardScore />

            <div className="flex h-5/6 w-5/6 flex-col items-center justify-center">{children}</div>

            <GameResultPanel />
        </div>
    );
};
