'use client';

import { useGame } from '@/contexts/GameContext';
import { GameStatusEnum } from '@/enum/game-status.enum';
import { AnimatePresence, motion } from 'framer-motion';
import { FC } from 'react';

export const GameBoardLost: FC = () => {
    const { gameStatus } = useGame();
    const isLost = gameStatus === GameStatusEnum.LOST;

    return (
        <AnimatePresence>
            {isLost && (
                <motion.div
                    className="absolute inset-0 bg-black"
                    initial={{ clipPath: 'circle(0% at 50% 50%)' }}
                    animate={{ clipPath: 'circle(150% at 50% 50%)' }}
                    exit={{ clipPath: 'circle(0% at 50% 50%)' }}
                    transition={{ duration: 3, ease: 'easeIn' }}
                />
            )}
        </AnimatePresence>
    );
};
