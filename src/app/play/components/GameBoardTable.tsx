'use client';

import { useGame } from '@/contexts/GameContext';
import { getFilledWordsArray } from '@/services/get-filled-words-array';
import { motion } from 'framer-motion';
import { FC, useEffect, useState } from 'react';
import { GameBoardCard } from './GameBoardCard';

export const GameBoardTable: FC = () => {
    const [resetKey, setResetKey] = useState(0);
    const { words } = useGame();

    useEffect(() => {
        setResetKey((prevKey) => prevKey + 1);
    }, [words]);

    return (
        <div
            key={resetKey}
            className="grid grid-cols-5 grid-rows-5 gap-3 w-full h-5/6 mx-auto z-10"
        >
            {getFilledWordsArray(0).map((_, index) => (
                <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                    <GameBoardCard index={index} />
                </motion.div>
            ))}
        </div>
    );
};
