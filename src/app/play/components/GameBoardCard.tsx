'use client';

import { useGame } from '@/contexts/GameContext';
import { GameStatusEnum } from '@/enum/game-status.enum';
import { ClassnameHelper } from '@/helpers/clean-classname.helper';
import { getCardColor } from '@/services/get-card-color';
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

    const sharedClasses =
        'w-full h-full flex items-center justify-center font-medium rounded-lg p-4 md:text-md lg:text-lg xl:text-xl shadow-md';

    return (
        <div className="perspective" onClick={handleClick}>
            <div className={ClassnameHelper.join('flip-card-inner', revealed ? 'flipped' : '')}>
                <div
                    className={ClassnameHelper.join(
                        'flip-card-front bg-gray-100/80 text-purple-900 transition-transform duration-300',
                        gameStatus === GameStatusEnum.PLAYING &&
                            'cursor-pointer hover:bg-gray-50 hover:scale-[1.02]',
                        sharedClasses,
                    )}
                >
                    <span className="text-center uppercase tracking-wide">{word}</span>
                </div>

                <div
                    className={ClassnameHelper.join(
                        'flip-card-back border-2',
                        sharedClasses,
                        getCardColor(role),
                    )}
                >
                    <span className="text-center uppercase tracking-wide">{word}</span>
                </div>
            </div>
        </div>
    );
};
