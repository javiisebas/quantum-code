// GameBoardCard.tsx
'use client';

import { useGame } from '@/contexts/GameContext';
import { GameStatusEnum } from '@/enum/game-status.enum';
import { NoTeamEnum } from '@/enum/no-team.enum';
import { TeamEnum } from '@/enum/team.enum';
import { ClassnameHelper } from '@/helpers/clean-classname.helper';
import { FC, useEffect, useState } from 'react';

interface CardProps {
    index: number;
}

export const GameBoardCard: FC<CardProps> = ({ index }) => {
    const [revealed, setRevealed] = useState(false);
    const { gameStatus, handleCardClick, roles, words, revealedRoles } = useGame();

    const role = roles[index];
    const word = words[index];

    useEffect(() => {
        if (gameStatus === GameStatusEnum.RESOLVED) setRevealed(true);
        else if (gameStatus === GameStatusEnum.PLAYING) setRevealed(revealedRoles[index]);
    }, [gameStatus, revealedRoles, index]);

    const handleClick = () => {
        if (!revealed && gameStatus === GameStatusEnum.PLAYING) {
            setRevealed(true);
            handleCardClick(index);
        }
    };

    const getCardColor = (): string => {
        switch (role) {
            case TeamEnum.BLUE:
                return 'bg-cyan-400/80 text-gray-800 shadow-lg shadow-cyan-600/30 border-cyan-500/40';
            case TeamEnum.RED:
                return 'bg-rose-400/80 text-gray-800 shadow-lg shadow-rose-600/30 border-rose-500/40';
            case NoTeamEnum.BLACK:
                return 'bg-black text-white shadow-lg shadow-black-600/30 border-black-500/40';
            case NoTeamEnum.NEUTRAL:
                return 'bg-orange-300/80 text-gray-800 shadow-lg shadow-orange-600/30 border-orange-500/40';
            default:
                return 'bg-gray-300 text-gray-800';
        }
    };

    const sharedClasses =
        'w-full h-full flex items-center justify-center font-medium rounded-md p-4 md:text-md lg:text-lg xl:text-xl';

    return (
        <div className="perspective" onClick={handleClick}>
            <div className={ClassnameHelper.join('flip-card-inner', revealed ? 'flipped' : '')}>
                <div
                    className={ClassnameHelper.join(
                        'flip-card-front bg-gray-300 text-gray-900 cursor-pointer hover:bg-gray-400/60 hover:scale-[1.02] transition-transform duration-300',
                        sharedClasses,
                    )}
                >
                    <span className="text-center uppercase tracking-wide">{word}</span>
                </div>

                <div
                    className={ClassnameHelper.join(
                        'flip-card-back border-2',
                        sharedClasses,
                        getCardColor(),
                    )}
                >
                    <span className="text-center uppercase tracking-wide">{word}</span>
                </div>
            </div>
        </div>
    );
};
