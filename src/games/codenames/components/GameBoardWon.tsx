'use client';

import { useGame } from '@/games/codenames/GameContext';
import { TeamEnum } from '@/games/codenames/enums/team.enum';
import { ConfettiBurst } from '@/platform/ui/Confetti';
import { ClassnameHelper } from '@/platform/util/classnames';
import { motion } from 'framer-motion';
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

/**
 * The win, as a colour: the board floods with the winning team's tint from the middle out, while
 * the confetti fires. Then — and only then — `GameResultPanel` lands on top of it with the words.
 *
 * The wave used to take 3s on an `easeIn`, which meant it did almost nothing for two seconds and
 * arrived AFTER the verdict panel had already faded in over an untouched board: the punchline
 * landed before the joke. It is now a fast `easeOut` sweep (the panel waits ~0.5s for it), so the
 * moment reads in the order it happens — flood, confetti, verdict.
 *
 * (No `AnimatePresence`: the component unmounts wholesale with the board, and the wrapper was
 * never given a keyed child to animate out.)
 */
export const GameBoardWon: FC = () => {
    const { showConfetti, hasTeamWon } = useGame();

    if (!showConfetti) return null;

    const team = TEAM[hasTeamWon === TeamEnum.BLUE ? TeamEnum.BLUE : TeamEnum.RED];

    return (
        <>
            <motion.div
                aria-hidden="true"
                className={ClassnameHelper.join('absolute inset-0', team.overlay)}
                initial={{ clipPath: 'circle(0% at 50% 50%)' }}
                animate={{ clipPath: 'circle(150% at 50% 50%)' }}
                transition={{ duration: 1.1, ease: 'easeOut' }}
            />
            <ConfettiBurst colors={team.confetti} intensity="final" />
        </>
    );
};
