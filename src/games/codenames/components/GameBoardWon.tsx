'use client';

import { useGame } from '@/games/codenames/GameContext';
import { TeamEnum } from '@/games/codenames/enums/team.enum';
import { ConfettiBurst } from '@/platform/ui/Confetti';
import { ClassnameHelper } from '@/platform/util/classnames';
import { AnimatePresence, motion } from 'framer-motion';
import { FC } from 'react';

/** The winning team's colours — Codenames' own teams, not an arcade accent token. */
const TEAM: Record<TeamEnum, { overlay: string; confetti: string[] }> = {
    [TeamEnum.BLUE]: {
        overlay: 'bg-sky-400/50',
        confetti: ['#0284c7', '#38bdf8', '#bae6fd', '#e0f2fe', '#ffffff'],
    },
    [TeamEnum.RED]: {
        overlay: 'bg-rose-400/50',
        confetti: ['#e11d48', '#fb7185', '#fecdd3', '#ffe4e6', '#ffffff'],
    },
};

export const GameBoardWon: FC = () => {
    const { showConfetti, hasTeamWon } = useGame();

    if (!showConfetti) return null;

    const team = TEAM[hasTeamWon === TeamEnum.BLUE ? TeamEnum.BLUE : TeamEnum.RED];

    return (
        <>
            <AnimatePresence>
                <motion.div
                    className={ClassnameHelper.join('absolute inset-0', team.overlay)}
                    initial={{ clipPath: 'circle(0% at 50% 50%)' }}
                    animate={{ clipPath: 'circle(150% at 50% 50%)' }}
                    exit={{ clipPath: 'circle(0% at 50% 50%)' }}
                    transition={{ duration: 3, ease: 'easeIn' }}
                />
            </AnimatePresence>
            <ConfettiBurst colors={team.confetti} />
        </>
    );
};
