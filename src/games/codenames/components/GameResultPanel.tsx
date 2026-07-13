'use client';

import { useGame } from '@/games/codenames/GameContext';
import { TeamEnum } from '@/games/codenames/domain';
import { GameStatusEnum } from '@/games/codenames/enums/game-status.enum';
import { Button } from '@/platform/ui/Button';
import { Surface } from '@/platform/ui/Surface';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { FC } from 'react';
import { BiHome, BiRefresh, BiShowAlt, BiSolidSkull, BiTrophy } from 'react-icons/bi';

interface ResultContent {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    accent: string;
    badge: string;
}

/**
 * Content for the end-of-game overlay. Only WON / LOST get a panel: those are outcomes
 * worth announcing. RESOLVED (the player chose "revelar cartas") deliberately returns
 * null — revealing the cards is precisely so you can SEE them, so we never cover the
 * board with a panel in that case.
 */
const getResultContent = (
    status: GameStatusEnum,
    hasTeamWon: TeamEnum | null,
): ResultContent | null => {
    if (status === GameStatusEnum.WON) {
        const isBlue = hasTeamWon === TeamEnum.BLUE;
        return {
            icon: <BiTrophy size={34} />,
            title: isBlue ? '¡Gana el equipo Azul!' : '¡Gana el equipo Rojo!',
            subtitle: 'Habéis descubierto todas vuestras cartas.',
            accent: isBlue ? 'text-sky-300' : 'text-rose-300',
            badge: isBlue ? 'bg-sky-400/15' : 'bg-rose-400/15',
        };
    }
    if (status === GameStatusEnum.LOST) {
        return {
            icon: <BiSolidSkull size={34} />,
            title: 'Habéis revelado al asesino',
            subtitle: 'Fin de la partida. Mala suerte, espías.',
            accent: 'text-gray-100',
            badge: 'bg-white/10',
        };
    }
    return null;
};

/**
 * End-of-game result overlay. Announces a win/loss and offers the next actions:
 *  - "Revelar cartas" reveals every colour and, because RESOLVED shows no panel,
 *    dismisses this overlay so you land on the fully-revealed board.
 *  - "Nueva partida" / "Inicio" for what's next.
 * (No standalone "ver tablero": revealing the cards is the useful way to inspect it.)
 */
export const GameResultPanel: FC = () => {
    const { gameStatus, hasTeamWon, resetGame, revealAll } = useGame();
    const router = useRouter();

    const content = getResultContent(gameStatus, hasTeamWon);

    return (
        <AnimatePresence>
            {content && (
                <motion.div
                    className="absolute inset-0 z-30 flex items-center justify-center p-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                >
                    {/* The motion wrapper owns the entrance and the width; the chrome is the app's
                        one `<Surface>` (this panel used to hand-roll a drifted copy of it). */}
                    <motion.div
                        className="w-full max-w-xs"
                        initial={{ scale: 0.9, y: 12 }}
                        animate={{ scale: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.4, ease: 'easeOut' }}
                    >
                        <Surface className="flex flex-col items-center gap-5 p-7 text-center shadow-2xl">
                            <span
                                className={`flex h-16 w-16 items-center justify-center rounded-full ${content.badge} ${content.accent}`}
                            >
                                {content.icon}
                            </span>
                            <div className="flex flex-col gap-1.5">
                                <h2 className={`text-xl font-bold ${content.accent}`}>
                                    {content.title}
                                </h2>
                                <p className="text-sm leading-relaxed text-gray-400">
                                    {content.subtitle}
                                </p>
                            </div>
                            <div className="flex w-full flex-col gap-2.5">
                                <Button
                                    variant="primary"
                                    fullWidth
                                    startContent={<BiRefresh size={20} />}
                                    onPress={resetGame}
                                >
                                    Nueva partida
                                </Button>
                                <Button
                                    variant="secondary"
                                    fullWidth
                                    startContent={<BiShowAlt size={20} />}
                                    onPress={revealAll}
                                >
                                    Revelar cartas
                                </Button>
                                <Button
                                    variant="ghost"
                                    fullWidth
                                    startContent={<BiHome size={20} />}
                                    onPress={() => router.push('/')}
                                >
                                    Inicio
                                </Button>
                            </div>
                        </Surface>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
