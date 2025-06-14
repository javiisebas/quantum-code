'use client';

import { useGame } from '@/contexts/GameContext';
import { TeamEnum } from '@/enum/team.enum';
import { ClassnameHelper } from '@/helpers/clean-classname.helper';
import { AnimatePresence, motion } from 'framer-motion';
import { FC } from 'react';
import Confetti from 'react-confetti';

export const GameBoardWon: FC = () => {
    const { showConfetti, hasTeamWon } = useGame();

    const confettiColors =
        hasTeamWon === TeamEnum.BLUE
            ? ['#0284c7', '#38bdf8', '#bae6fd']
            : ['#e11d48', '#fb7185', '#fecdd3'];

    if (!showConfetti) return null;

    return (
        <>
            <AnimatePresence>
                <motion.div
                    className={ClassnameHelper.join(
                        'absolute inset-0',
                        hasTeamWon === TeamEnum.BLUE ? 'bg-sky-400/50' : 'bg-rose-400/50',
                    )}
                    initial={{ clipPath: 'circle(0% at 50% 50%)' }}
                    animate={{ clipPath: 'circle(150% at 50% 50%)' }}
                    exit={{ clipPath: 'circle(0% at 50% 50%)' }}
                    transition={{ duration: 3, ease: 'easeIn' }}
                />
            </AnimatePresence>
            <Confetti colors={confettiColors} />;
        </>
    );
};
