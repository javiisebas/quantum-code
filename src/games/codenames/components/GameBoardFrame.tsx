'use client';

import { PrimaryButton } from '@/platform/ui/Button';
import { useGame } from '@/games/codenames/GameContext';
import { ClassnameHelper } from '@/platform/util/classnames';
import { ChildrenProps } from '@/platform/util/children';
import { Spinner } from '@heroui/react';
import { FC } from 'react';
import { BiErrorCircle } from 'react-icons/bi';
import { GameBoardLost } from './GameBoardLost';
import { GameBoardScore } from './GameBoardScore';
import { GameBoardWon } from './GameBoardWon';
import { GameResultPanel } from './GameResultPanel';

export const GameBoardFrame: FC<ChildrenProps> = ({ children }) => {
    const { loading, error, retry } = useGame();

    // Role loading failed (e.g. the API/Redis is down) — never leave the board stuck
    // on a spinner; show a recoverable error with a retry action.
    if (error) {
        return (
            <div className="flex h-screen w-screen flex-col items-center justify-center gap-5 px-6 text-center">
                <BiErrorCircle className="text-rose-400" size={48} aria-hidden="true" />
                <div className="flex flex-col gap-1">
                    <h2 className="text-xl font-semibold text-white">Algo ha ido mal</h2>
                    <p className="max-w-sm text-sm text-gray-300">{error}</p>
                </div>
                <PrimaryButton onPress={retry}>Reintentar</PrimaryButton>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex h-screen w-screen flex-col items-center justify-center gap-4">
                <Spinner size="lg" color="secondary" />
                <p className="text-sm text-gray-400">Preparando la partida…</p>
            </div>
        );
    }

    return (
        <div
            className={ClassnameHelper.join(
                'h-screen w-screen relative flex items-center justify-center isolate',
            )}
        >
            <GameBoardLost />
            <GameBoardWon />
            <GameBoardScore />

            <div className="w-5/6 h-5/6 flex items-center justify-center flex-col">{children}</div>

            <GameResultPanel />
        </div>
    );
};
