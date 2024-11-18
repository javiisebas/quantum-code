'use client';

import { useGame } from '@/contexts/GameContext';
import { TeamEnum } from '@/enum/team.enum';
import { ClassnameHelper } from '@/helpers/clean-classname.helper';
import { ChildrenProps } from '@/types/children.type';
import { Spinner } from '@nextui-org/react';
import { FC } from 'react';
import Confetti from 'react-confetti';

export const GameBoardFrame: FC<ChildrenProps> = ({ children }) => {
    const { showConfetti, hasTeamWon, loading } = useGame();

    const confettiColors =
        hasTeamWon === TeamEnum.BLUE
            ? ['#3b82f6', '#60a5fa', '#93c5fd']
            : ['#ef4444', '#f87171', '#fca5a5'];

    if (loading) {
        return (
            <div className="h-screen w-screen flex items-center justify-center">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div
            className={ClassnameHelper.join(
                'h-screen w-screen relative flex items-center justify-center isolate',
            )}
        >
            {showConfetti && <Confetti colors={confettiColors} />}
            <div className="w-5/6 h-5/6 flex items-center justify-center flex-col">{children}</div>
        </div>
    );
};
