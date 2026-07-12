'use client';

import { useGame } from '@/contexts/GameContext';
import { TeamEnum } from '@/domain';
import { GameStatusEnum } from '@/enum/game-status.enum';
import { ClassnameHelper } from '@/helpers/clean-classname.helper';
import { FC } from 'react';
import { BiRightArrowAlt } from 'react-icons/bi';

interface TeamPillProps {
    label: string;
    found: number;
    total: number;
    dotClass: string;
    textClass: string;
    ringClass: string;
    active: boolean;
    playing: boolean;
}

const TeamPill: FC<TeamPillProps> = ({
    label,
    found,
    total,
    dotClass,
    textClass,
    ringClass,
    active,
    playing,
}) => {
    const remaining = Math.max(total - found, 0);
    return (
        <div
            className={ClassnameHelper.join(
                'flex items-center gap-2 rounded-full bg-gray-900/70 px-3 py-1.5 ring-1 backdrop-blur transition-all',
                active && playing
                    ? ClassnameHelper.join('ring-2 bg-gray-900/90', ringClass)
                    : 'ring-white/10',
                !active && playing && 'opacity-55',
            )}
            aria-label={`${label}: quedan ${remaining} de ${total}${active && playing ? ', en turno' : ''}`}
        >
            <span
                className={ClassnameHelper.join(
                    'h-2.5 w-2.5 rounded-full',
                    dotClass,
                    active && playing && 'animate-pulse',
                )}
                aria-hidden="true"
            />
            <span className="text-xs font-medium text-gray-300">{label}</span>
            <span className={`text-sm font-bold tabular-nums ${textClass}`}>
                {remaining}
                <span className="text-gray-500">/{total}</span>
            </span>
        </div>
    );
};

/**
 * Turn + score HUD. Shows cards-still-to-find per team and, while the game is in
 * progress, which team is on turn (highlighted) with a manual "pass turn" control.
 * Turn otherwise auto-passes on a neutral/rival reveal (see the game reducer).
 */
export const GameBoardScore: FC = () => {
    const { progress, currentTurn, gameStatus, passTurn } = useGame();
    const playing = gameStatus === GameStatusEnum.PLAYING;

    return (
        <div className="absolute top-6 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-2">
            <div className="flex gap-3">
                <TeamPill
                    label="Azul"
                    found={progress.blue.found}
                    total={progress.blue.total}
                    dotClass="bg-sky-400"
                    textClass="text-sky-300"
                    ringClass="ring-sky-400/70"
                    active={currentTurn === TeamEnum.BLUE}
                    playing={playing}
                />
                <TeamPill
                    label="Rojo"
                    found={progress.red.found}
                    total={progress.red.total}
                    dotClass="bg-rose-400"
                    textClass="text-rose-300"
                    ringClass="ring-rose-400/70"
                    active={currentTurn === TeamEnum.RED}
                    playing={playing}
                />
            </div>

            {playing && (
                <button
                    type="button"
                    onClick={passTurn}
                    className="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium text-gray-400 transition-colors hover:text-white"
                >
                    Turno de{' '}
                    <span
                        className={
                            currentTurn === TeamEnum.BLUE ? 'text-sky-300' : 'text-rose-300'
                        }
                    >
                        {currentTurn === TeamEnum.BLUE ? 'Azul' : 'Rojo'}
                    </span>
                    <span className="mx-1 text-gray-600">·</span>
                    Pasar turno
                    <BiRightArrowAlt size={16} aria-hidden="true" />
                </button>
            )}
        </div>
    );
};
