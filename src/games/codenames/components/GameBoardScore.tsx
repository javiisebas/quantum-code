'use client';

import { useGame } from '@/games/codenames/GameContext';
import { TeamEnum } from '@/games/codenames/domain';
import { GameStatusEnum } from '@/games/codenames/enums/game-status.enum';
import { ClassnameHelper } from '@/platform/util/classnames';
import { FC } from 'react';
import { BiTransferAlt } from 'react-icons/bi';

interface TeamStyle {
    label: string;
    dot: string;
    text: string;
    ring: string;
    glow: string;
}

const TEAM_STYLES: Record<TeamEnum, TeamStyle> = {
    [TeamEnum.BLUE]: {
        label: 'Azul',
        dot: 'bg-sky-400',
        text: 'text-sky-300',
        ring: 'ring-sky-400/60',
        glow: 'shadow-sky-500/20',
    },
    [TeamEnum.RED]: {
        label: 'Rojo',
        dot: 'bg-rose-400',
        text: 'text-rose-300',
        ring: 'ring-rose-400/60',
        glow: 'shadow-rose-500/20',
    },
};

interface TeamPillProps {
    style: TeamStyle;
    found: number;
    total: number;
    active: boolean;
    playing: boolean;
}

const TeamPill: FC<TeamPillProps> = ({ style, found, total, active, playing }) => {
    const remaining = Math.max(total - found, 0);
    const highlighted = active && playing;
    return (
        <div
            className={ClassnameHelper.join(
                'flex items-center gap-2 rounded-full px-3.5 py-1.5 backdrop-blur transition-all duration-300',
                highlighted
                    ? ClassnameHelper.join('bg-gray-900/90 ring-2 shadow-lg', style.ring, style.glow)
                    : 'bg-gray-900/60 ring-1 ring-white/10',
                !active && playing && 'opacity-45',
            )}
            aria-label={`${style.label}: quedan ${remaining} de ${total}${highlighted ? ', en turno' : ''}`}
        >
            <span
                className={ClassnameHelper.join(
                    'h-2.5 w-2.5 rounded-full',
                    style.dot,
                    highlighted && 'animate-pulse',
                )}
                aria-hidden="true"
            />
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-300">
                {style.label}
            </span>
            <span className={ClassnameHelper.join('text-sm font-bold tabular-nums', style.text)}>
                {remaining}
                <span className="text-gray-600">/{total}</span>
            </span>
        </div>
    );
};

/**
 * Turn + score HUD. Shows cards-still-to-find per team and, while the game is in
 * progress, which team is on turn (highlighted with a glow) plus a manual
 * "pass turn" control. Turn otherwise auto-passes on a neutral/rival reveal
 * (see the game reducer).
 */
export const GameBoardScore: FC = () => {
    const { progress, currentTurn, gameStatus, passTurn } = useGame();
    const playing = gameStatus === GameStatusEnum.PLAYING;
    const turnStyle = TEAM_STYLES[currentTurn];

    return (
        <div className="absolute top-5 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-2.5">
            <div className="flex items-center gap-2">
                <TeamPill
                    style={TEAM_STYLES[TeamEnum.BLUE]}
                    found={progress.blue.found}
                    total={progress.blue.total}
                    active={currentTurn === TeamEnum.BLUE}
                    playing={playing}
                />
                <TeamPill
                    style={TEAM_STYLES[TeamEnum.RED]}
                    found={progress.red.found}
                    total={progress.red.total}
                    active={currentTurn === TeamEnum.RED}
                    playing={playing}
                />
            </div>

            {playing && (
                <button
                    type="button"
                    onClick={passTurn}
                    className="group flex items-center gap-2 rounded-full bg-white/5 px-3.5 py-1.5 text-xs font-medium text-gray-300 ring-1 ring-white/10 backdrop-blur transition-colors hover:bg-white/10 hover:text-white"
                >
                    <span className="text-gray-400">Turno de</span>
                    <span className={ClassnameHelper.join('font-semibold', turnStyle.text)}>
                        {turnStyle.label}
                    </span>
                    <span className="h-3.5 w-px bg-white/15" aria-hidden="true" />
                    <span>Pasar turno</span>
                    <BiTransferAlt
                        size={15}
                        aria-hidden="true"
                        className="transition-transform group-hover:translate-x-0.5"
                    />
                </button>
            )}
        </div>
    );
};
