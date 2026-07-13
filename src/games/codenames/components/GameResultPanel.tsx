'use client';

import { useGame } from '@/games/codenames/GameContext';
import { TeamEnum } from '@/games/codenames/domain';
import { GameStatusEnum } from '@/games/codenames/enums/game-status.enum';
import { Button } from '@/platform/ui/Button';
import { Eyebrow } from '@/platform/ui/Eyebrow';
import { Surface } from '@/platform/ui/Surface';
import { ClassnameHelper } from '@/platform/util/classnames';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { FC } from 'react';
import { BiHome, BiRefresh, BiShowAlt, BiSolidSkull, BiTrophy } from 'react-icons/bi';

interface ResultContent {
    icon: React.ReactNode;
    /** The small label above the verdict ("Fin de la partida"). */
    eyebrow: string;
    title: string;
    subtitle: string;
    accent: string;
    /** The medallion: tint + ring, the same recipe the arcade's podium crowns a winner with. */
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
            icon: <BiTrophy size={40} />,
            eyebrow: 'Fin de la partida',
            title: isBlue ? '¡Gana el equipo Azul!' : '¡Gana el equipo Rojo!',
            subtitle: 'Habéis descubierto todas vuestras cartas.',
            accent: isBlue ? 'text-sky-300' : 'text-rose-300',
            badge: isBlue ? 'bg-sky-400/15 ring-sky-400/40' : 'bg-rose-400/15 ring-rose-400/40',
        };
    }
    if (status === GameStatusEnum.LOST) {
        return {
            icon: <BiSolidSkull size={40} />,
            eyebrow: 'Fin de la partida',
            title: 'Habéis revelado al asesino',
            subtitle: 'Fin de la partida. Mala suerte, espías.',
            accent: 'text-gray-100',
            badge: 'bg-white/10 ring-white/20',
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
 *
 * This is Codenames' podium, so it is staged like one: the verdict LANDS on a spring, inside the
 * same accent medallion the live games' `<Podium>`/`<RankCard>` use, under the same `<Eyebrow>`.
 * Codenames has no scoreboard — a team either found its cards or hit the assassin — so the
 * hierarchy here is the verdict itself: medallion, then title, then what happens next. It waits
 * for `GameBoardWon`'s colour wash to sweep the board first (that is the celebration); the panel
 * is the sentence that follows it, not a card that appears before the party.
 */
export const GameResultPanel: FC = () => {
    const { gameStatus, hasTeamWon, resetGame, revealAll } = useGame();
    const router = useRouter();

    const content = getResultContent(gameStatus, hasTeamWon);

    return (
        <AnimatePresence>
            {content && (
                <motion.div
                    // A SCRIM, not just a floating card. `Surface` is frosted glass, which is
                    // legible over the app's dark background but not over 25 saturated red and
                    // blue cards: the words behind it bled through the verdict and the whole panel
                    // read as muddy. Dimming the board is also what makes the verdict the thing you
                    // look at — the board has just had its moment.
                    className="absolute inset-0 z-30 flex items-center justify-center bg-gray-950/70 p-6 backdrop-blur-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, delay: 0.5 }}
                >
                    {/* The motion wrapper owns the entrance and the width; the chrome is the app's
                        one `<Surface>` (this panel used to hand-roll a drifted copy of it). */}
                    <motion.div
                        className="w-full max-w-sm"
                        initial={{ scale: 0.88, y: 16 }}
                        animate={{ scale: 1, y: 0 }}
                        transition={{
                            type: 'spring',
                            stiffness: 240,
                            damping: 20,
                            delay: 0.55,
                        }}
                    >
                        <Surface className="flex flex-col items-center gap-5 p-8 text-center shadow-2xl">
                            <span
                                className={ClassnameHelper.join(
                                    'flex h-20 w-20 items-center justify-center rounded-full ring-1 ring-inset',
                                    content.badge,
                                    content.accent,
                                )}
                            >
                                {content.icon}
                            </span>
                            <div className="flex flex-col gap-1.5">
                                <Eyebrow>{content.eyebrow}</Eyebrow>
                                <h2
                                    className={ClassnameHelper.join(
                                        'text-2xl font-extrabold',
                                        content.accent,
                                    )}
                                >
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
