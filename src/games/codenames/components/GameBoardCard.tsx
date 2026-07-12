'use client';

import { useGame } from '@/games/codenames/GameContext';
import { GameStatusEnum } from '@/games/codenames/enums/game-status.enum';
import { ClassnameHelper } from '@/platform/util/classnames';
import { getCardColor } from '@/games/codenames/get-card-color';
import { FC } from 'react';

interface CardProps {
    index: number;
}

const sharedClasses =
    'w-full h-full flex items-center justify-center font-medium rounded-lg p-1 sm:p-2 md:p-4 text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl shadow-md';

export const GameBoardCard: FC<CardProps> = ({ index }) => {
    const { gameStatus, handleCardClick, roles, words, revealedRoles } = useGame();

    const role = roles[index];
    const word = words[index];

    // Single source of truth: the card's revealed state lives in the game context.
    // `revealAll` also flips every entry to `true`, so this covers the RESOLVED case.
    const revealed = revealedRoles[index];
    const isInteractive = gameStatus === GameStatusEnum.PLAYING && !revealed;

    const handleClick = () => {
        if (isInteractive) handleCardClick(index);
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            disabled={!isInteractive}
            aria-label={revealed ? `${word} (revealed)` : word}
            className={ClassnameHelper.join(
                'perspective block appearance-none border-0 bg-transparent p-0 rounded-lg',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70',
                isInteractive && 'cursor-pointer',
            )}
        >
            <div className={ClassnameHelper.join('flip-card-inner', revealed && 'flipped')}>
                <div
                    className={ClassnameHelper.join(
                        'flip-card-front bg-gray-100/80 text-purple-900 transition-transform duration-300',
                        isInteractive && 'hover:bg-gray-50 hover:scale-[1.02]',
                        sharedClasses,
                    )}
                >
                    <span className="w-full hyphens-auto break-words text-center uppercase leading-tight tracking-tight sm:tracking-wide">
                        {word}
                    </span>
                </div>

                <div
                    className={ClassnameHelper.join(
                        'flip-card-back border-2',
                        sharedClasses,
                        getCardColor(role),
                    )}
                >
                    <span className="w-full hyphens-auto break-words text-center uppercase leading-tight tracking-tight sm:tracking-wide">
                        {word}
                    </span>
                </div>
            </div>
        </button>
    );
};
