'use client';

import { useGame } from '@/games/codenames/GameContext';
import { GameStatusEnum } from '@/games/codenames/enums/game-status.enum';
import { FOCUS_RING_LIGHT } from '@/platform/ui/Button';
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
        // A raw <button>: no variant can express a two-faced card that flips in 3D, and the word
        // grid IS the board rather than a control on it. What it does take from the system is the
        // focus ring (`FOCUS_RING_LIGHT` — white, because this button sits on colour). It keeps its
        // own "disabled" look: here `disabled` means the card is already FLIPPED, a state the face
        // itself shows, not an action that is unavailable — the primitive's muted grey fill would
        // paint over the very colour the player just revealed.
        <button
            type="button"
            onClick={handleClick}
            disabled={!isInteractive}
            aria-label={revealed ? `${word} (revelada)` : word}
            className={ClassnameHelper.join(
                'perspective block appearance-none rounded-lg border-0 bg-transparent p-0',
                FOCUS_RING_LIGHT,
                isInteractive && 'cursor-pointer',
            )}
        >
            <div className={ClassnameHelper.join('flip-card-inner', revealed && 'flipped')}>
                <div
                    className={ClassnameHelper.join(
                        // Unrevealed cards are dark "chips" so any revealed card — teams,
                        // and especially the light neutral — pops and is never mistaken
                        // for a still-unclicked card.
                        'flip-card-front bg-slate-700 text-slate-50 ring-1 ring-inset ring-white/10 transition-transform duration-300',
                        isInteractive && 'hover:bg-slate-600 hover:scale-[1.02]',
                        sharedClasses,
                    )}
                >
                    <span className="w-full hyphens-auto break-words text-center uppercase leading-tight tracking-tight sm:tracking-wide">
                        {word}
                    </span>
                </div>

                <div
                    className={ClassnameHelper.join(
                        'flip-card-back',
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
