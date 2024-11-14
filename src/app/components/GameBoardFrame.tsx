'use client';

import { useGame } from '@/contexts/GameContext';
import { GameStatusEnum } from '@/enum/game-status.enum';
import { TeamEnum } from '@/enum/team.enum';
import { ClassnameHelper } from '@/helpers/clean-classname.helper';
import { ChildrenProps } from '@/types/children.type';
import { FC } from 'react';
import Confetti from 'react-confetti';

export const GameBoardFrame: FC<ChildrenProps> = ({ children }) => {
    const { gameStatus, showConfetti, hasTeamWon } = useGame();

    const backgroundClass: Partial<Record<GameStatusEnum, string>> = {
        [GameStatusEnum.LOST]: 'bg-black text-white',
        [GameStatusEnum.PLAYING]: 'bg-white',
        [GameStatusEnum.RESOLVED]: 'bg-gray-100',
    };

    const backgroundByTeamWon: Record<TeamEnum, string> = {
        [TeamEnum.BLUE]: 'bg-cyan-200',
        [TeamEnum.RED]: 'bg-rose-200',
    };

    const confettiColors =
        hasTeamWon === TeamEnum.BLUE
            ? ['#3b82f6', '#60a5fa', '#93c5fd']
            : ['#ef4444', '#f87171', '#fca5a5'];

    return (
        <div
            className={ClassnameHelper.join(
                'h-screen w-screen relative flex items-center justify-center isolate',
                backgroundClass[gameStatus] || backgroundByTeamWon[hasTeamWon!],
            )}
        >
            {showConfetti && <Confetti colors={confettiColors} />}
            <div className="w-5/6 h-5/6 flex items-center justify-center flex-col">{children}</div>
        </div>
    );
};
