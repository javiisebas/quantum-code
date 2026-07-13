'use client';

import { NoTeamEnum } from '@/games/codenames/enums/no-team.enum';
import { RoleEnum } from '@/games/codenames/enums/role.enum';
import { TeamEnum } from '@/games/codenames/enums/team.enum';
import { Surface } from '@/platform/ui/Surface';
import { ClassnameHelper } from '@/platform/util/classnames';
import { getCardColor } from '@/games/codenames/get-card-color';
import { motion } from 'framer-motion';
import { FC, ReactNode } from 'react';
import { BiSolidSkull } from 'react-icons/bi';
import { SpyBoardFrame } from './SpyBoardFrame';

interface SpyBoardProps {
    roles: RoleEnum[];
    words: string[];
}

const ROLE_LABELS: Record<RoleEnum, string> = {
    [TeamEnum.BLUE]: 'Equipo azul',
    [TeamEnum.RED]: 'Equipo rojo',
    [NoTeamEnum.NEUTRAL]: 'Neutral',
    [NoTeamEnum.BLACK]: 'Asesino',
};

// Redundant, colour-independent cue for each role so the key is readable by
// colour-blind players (and the assassin is unmistakable at a glance). Rendered
// subtly in the corner, inheriting each card's own dark text colour.
const ROLE_GLYPH: Record<RoleEnum, ReactNode> = {
    [TeamEnum.BLUE]: 'A',
    [TeamEnum.RED]: 'R',
    [NoTeamEnum.NEUTRAL]: 'N',
    [NoTeamEnum.BLACK]: <BiSolidSkull />,
};

/**
 * The spies' view: the full board with each word shown on its team colour, kept in
 * the same 5×5 layout as the shared play board so spymasters can correlate by
 * position. Scrolls vertically on small screens where 25 word-cells don't fit.
 */
export const SpyBoard: FC<SpyBoardProps> = ({ roles, words }) => {
    return (
        <SpyBoardFrame>
            <Surface
                tone="plain"
                radius="2xl"
                className="w-full bg-gray-400/50 p-2 shadow-2xl shadow-gray-200/10 ring-gray-900/10 sm:p-3"
            >
                {/* The board's dark mat, inside the light tray. Deliberately NOT a `<Surface>`:
                    its ring would draw a second edge a few pixels inside the tray's own, which is
                    exactly the double-border look the tray is meant to give once. */}
                <div className="rounded-xl bg-gray-900 p-2 sm:p-3">
                    <div
                        className="grid grid-cols-5 gap-1.5 sm:gap-2"
                        role="list"
                        aria-label="Mapa secreto de la partida"
                    >
                        {roles.map((role, index) => (
                            <motion.div
                                key={index}
                                role="listitem"
                                aria-label={`Casilla ${index + 1}: ${words[index]}, ${ROLE_LABELS[role]}`}
                                initial={{ opacity: 0, scale: 0.85 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.25, delay: index * 0.03 }}
                            >
                                <div
                                    className={ClassnameHelper.join(
                                        getCardColor(role),
                                        'relative flex min-h-[64px] w-full items-center justify-center rounded-lg border-2 p-1 shadow-none sm:min-h-[84px] sm:p-2',
                                    )}
                                >
                                    <span
                                        className="absolute left-1 top-0.5 text-[9px] font-bold opacity-45 sm:text-[11px]"
                                        aria-hidden="true"
                                    >
                                        {ROLE_GLYPH[role]}
                                    </span>
                                    <span className="hyphens-auto break-words text-center text-[11px] font-semibold uppercase leading-tight tracking-tight sm:text-sm">
                                        {words[index]}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </Surface>
        </SpyBoardFrame>
    );
};
