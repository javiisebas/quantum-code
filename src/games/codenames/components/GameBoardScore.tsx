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
    activeBg: string;
    activeRing: string;
}

const TEAM_STYLES: Record<TeamEnum, TeamStyle> = {
    [TeamEnum.BLUE]: {
        label: 'Azul',
        dot: 'bg-sky-400',
        activeBg: 'bg-sky-500/15',
        activeRing: 'ring-sky-400/50',
    },
    [TeamEnum.RED]: {
        label: 'Rojo',
        dot: 'bg-rose-400',
        activeBg: 'bg-rose-500/15',
        activeRing: 'ring-rose-400/50',
    },
};

interface TeamSegmentProps {
    style: TeamStyle;
    remaining: number;
    total: number;
    active: boolean;
    playing: boolean;
    align: 'left' | 'right';
}

const TeamSegment: FC<TeamSegmentProps> = ({ style, remaining, total, active, playing, align }) => {
    const highlighted = active && playing;
    return (
        <div
            className={ClassnameHelper.join(
                'flex items-center gap-2.5 rounded-2xl px-4 py-2 ring-1 ring-inset transition-all duration-300',
                align === 'right' && 'flex-row-reverse',
                highlighted
                    ? ClassnameHelper.join(style.activeBg, style.activeRing)
                    : 'ring-transparent',
                playing && !active && 'opacity-40',
            )}
            aria-label={`${style.label}: quedan ${remaining} de ${total}${highlighted ? ', en turno' : ''}`}
        >
            <span
                className={ClassnameHelper.join(
                    'h-2.5 w-2.5 shrink-0 rounded-full',
                    style.dot,
                    highlighted && 'animate-pulse',
                )}
                aria-hidden="true"
            />
            <div className={ClassnameHelper.join('flex flex-col', align === 'right' && 'items-end')}>
                <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-400">
                    {style.label}
                </span>
                <span className="text-lg font-bold leading-none tabular-nums text-white">
                    {remaining}
                    <span className="text-sm font-medium text-gray-500">/{total}</span>
                </span>
            </div>
        </div>
    );
};

/**
 * Turn + score HUD. A single floating bar with each team's cards-still-to-find and,
 * between them, a "pass turn" control. The team on turn is highlighted with its own
 * colour (no redundant "turno de…" label — the glow says it); turn otherwise
 * auto-passes on a neutral/rival reveal (see the game reducer).
 */
export const GameBoardScore: FC = () => {
    const { progress, currentTurn, gameStatus, passTurn } = useGame();
    const playing = gameStatus === GameStatusEnum.PLAYING;
    const turnStyle = TEAM_STYLES[currentTurn];

    return (
        <div className="absolute left-1/2 top-5 z-20 -translate-x-1/2">
            <div className="flex items-center gap-1 rounded-[1.4rem] bg-gray-900/70 p-1.5 shadow-xl shadow-black/30 ring-1 ring-white/10 backdrop-blur-md">
                <TeamSegment
                    style={TEAM_STYLES[TeamEnum.BLUE]}
                    remaining={Math.max(progress.blue.total - progress.blue.found, 0)}
                    total={progress.blue.total}
                    active={currentTurn === TeamEnum.BLUE}
                    playing={playing}
                    align="left"
                />

                {playing ? (
                    <button
                        type="button"
                        onClick={passTurn}
                        aria-label={`Pasar turno (ahora juega ${turnStyle.label})`}
                        title="Pasar turno"
                        className={ClassnameHelper.join(
                            'group flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                            'bg-white/5 text-gray-300 ring-1 ring-inset ring-white/10 transition-all',
                            'hover:bg-white/15 hover:text-white active:scale-90',
                        )}
                    >
                        <BiTransferAlt
                            size={20}
                            aria-hidden="true"
                            className="transition-transform duration-300 group-hover:rotate-180"
                        />
                    </button>
                ) : (
                    <span className="w-2" aria-hidden="true" />
                )}

                <TeamSegment
                    style={TEAM_STYLES[TeamEnum.RED]}
                    remaining={Math.max(progress.red.total - progress.red.found, 0)}
                    total={progress.red.total}
                    active={currentTurn === TeamEnum.RED}
                    playing={playing}
                    align="right"
                />
            </div>
        </div>
    );
};
