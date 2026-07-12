'use client';

import { PrimaryButton } from '@/app/components/ui/Button';
import { useGame } from '@/contexts/GameContext';
import { TeamEnum } from '@/domain';
import { GameStatusEnum } from '@/enum/game-status.enum';
import { Button } from '@heroui/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { FC, useEffect, useState } from 'react';
import { BiHome, BiSolidSkull, BiTrophy } from 'react-icons/bi';

interface ResultContent {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    accent: string;
}

const getResultContent = (
    status: GameStatusEnum,
    hasTeamWon: TeamEnum | null,
): ResultContent | null => {
    if (status === GameStatusEnum.WON) {
        const isBlue = hasTeamWon === TeamEnum.BLUE;
        return {
            icon: <BiTrophy size={44} />,
            title: isBlue ? '¡Gana el equipo Azul!' : '¡Gana el equipo Rojo!',
            subtitle: 'Habéis descubierto todas vuestras cartas.',
            accent: isBlue ? 'text-sky-300' : 'text-rose-300',
        };
    }
    if (status === GameStatusEnum.LOST) {
        return {
            icon: <BiSolidSkull size={44} />,
            title: 'Habéis revelado al asesino',
            subtitle: 'Fin de la partida. Mala suerte, espías.',
            accent: 'text-gray-200',
        };
    }
    if (status === GameStatusEnum.RESOLVED) {
        return {
            icon: <BiTrophy size={44} />,
            title: 'Cartas reveladas',
            subtitle: 'Se muestra el color de todas las palabras.',
            accent: 'text-purple-300',
        };
    }
    return null;
};

/**
 * End-of-game result overlay: announces the outcome and offers the next actions.
 * Dismissible ("Ver tablero") so players can review the fully-revealed grid.
 */
export const GameResultPanel: FC = () => {
    const { gameStatus, hasTeamWon, resetGame } = useGame();
    const router = useRouter();
    const [dismissed, setDismissed] = useState(false);

    // Re-show the panel on every fresh terminal transition.
    useEffect(() => {
        setDismissed(false);
    }, [gameStatus]);

    const content = getResultContent(gameStatus, hasTeamWon);
    const isOpen = !!content && !dismissed;

    return (
        <AnimatePresence>
            {isOpen && content && (
                <motion.div
                    className="absolute inset-0 z-30 flex items-center justify-center p-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                >
                    <motion.div
                        className="flex w-full max-w-sm flex-col items-center gap-5 rounded-3xl bg-gray-900/90 p-8 text-center ring-1 ring-white/10 shadow-2xl backdrop-blur"
                        initial={{ scale: 0.9, y: 12 }}
                        animate={{ scale: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.4, ease: 'easeOut' }}
                    >
                        <span className={content.accent}>{content.icon}</span>
                        <div className="flex flex-col gap-1">
                            <h2 className={`text-2xl font-bold ${content.accent}`}>
                                {content.title}
                            </h2>
                            <p className="text-sm text-gray-300">{content.subtitle}</p>
                        </div>
                        <div className="flex w-full flex-col gap-2">
                            <PrimaryButton className="w-full" onPress={resetGame}>
                                Nueva partida
                            </PrimaryButton>
                            <div className="flex gap-2">
                                <Button
                                    variant="bordered"
                                    className="w-full border-white/20 text-white"
                                    onPress={() => setDismissed(true)}
                                >
                                    Ver tablero
                                </Button>
                                <Button
                                    variant="light"
                                    className="w-full text-gray-300"
                                    startContent={<BiHome size={18} />}
                                    onPress={() => router.push('/')}
                                >
                                    Inicio
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
