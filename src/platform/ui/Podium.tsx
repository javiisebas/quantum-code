'use client';

import { Button } from '@/platform/ui/Button';
import { Chip } from '@/platform/ui/Chip';
import { ConfettiBurst } from '@/platform/ui/Confetti';
import { Eyebrow } from '@/platform/ui/Eyebrow';
import { Surface } from '@/platform/ui/Surface';
import { ClassnameHelper } from '@/platform/util/classnames';
import { motion } from 'framer-motion';
import { ReactNode } from 'react';

/**
 * How every game in the arcade ends, on both screens:
 *
 *  - `<Podium>` on the shared screen — confetti, the champion, the ranked table, "jugar otra vez".
 *  - `<RankCard>` on the phone — "did I win, and where did I come?".
 *  - `<ScoreChips>` between rounds — the same ranking, read in five seconds from a sofa.
 *
 * Both were copy-pasted once per live game (three near-identical `FinalStage`s, three
 * near-identical final phone cards) and drifted: one podium tinted the leader row, another
 * hard-coded `text-cyan-300` where the accent token said the same thing, a third used a different
 * trophy size. The only real differences were the accent and how a score reads (`💣 3` vs `12
 * puntos`) — so those are the props, and everything else is fixed.
 *
 * These are the PAYOFF screens: the whole game was played to see them, and a room full of people
 * looks at them together. So they are built to LAND, not merely to be correct:
 *
 *  - one hero (the champion in an accent medallion) that springs in and owns the top of the frame;
 *  - real hierarchy below it — 🥇🥈🥉, a bigger/tinted champion row, brighter names on the podium
 *    than off it — so "who won" is legible from the sofa without reading a single number;
 *  - a staggered cascade, so the standings arrive as a countdown instead of appearing all at once.
 *
 * The restraint that keeps it the same product: no new colours, no new shapes. The medallion is
 * the accent `highlight` the leader row already used, the caption is the app's `Chip`, the motion
 * is Framer (and `<MotionConfig reducedMotion="user">` in `providers` turns it off for anyone who
 * asked for less of it — the layout is identical either way, only the entrance is skipped).
 *
 * A `platform/` component never reaches into a game's colour tokens: the accent arrives as plain
 * class strings (the same contract `<Button variant="accent">` uses), and `AccentClasses` from
 * `games/_shared/accents` satisfies it structurally, so a game just passes `accent={acc}`.
 */
export interface PodiumAccent {
    /** Accent-tinted text (champion name, score column). */
    text: string;
    /** Leader tint: background + ring colour. Used for the leader row AND the hero medallion. */
    highlight: string;
    /** Solid fill for the "play again" CTA. */
    solidButton: string;
    /** Celebration palette. */
    confetti: string[];
}

export interface PodiumEntry {
    /** Stable key — the player's seat. */
    id: number | string;
    name: string;
    /** The score VALUE, rendered as-is so each game keeps its own unit (`💣 3`, `1200`). */
    score: ReactNode;
    /**
     * Optional short suffix for the value (`pts`), set in a muted style beside it. A bare `1200`
     * in a column means nothing at a glance; `1200 pts` does, and it costs no vertical space.
     * Games whose value is already self-describing (`💣 3`) leave it out.
     */
    unit?: ReactNode;
}

/** 🥇🥈🥉 for the podium, a plain position for everyone else. */
const MEDALS = ['🥇', '🥈', '🥉'];
const medalOf = (index: number): string | undefined => MEDALS[index];

/**
 * The cascade. The champion's row lands right after the hero, then the rest fall in — capped, so
 * a full room of 12 still finishes in about a second instead of turning the reveal into a wait.
 */
const ROW_DELAY = 0.2;
const ROW_STAGGER = 0.07;
const rowDelay = (index: number) => ROW_DELAY + Math.min(index, 7) * ROW_STAGGER;

export function Podium({
    entries,
    accent,
    label,
    caption,
    onRestart,
    restartLabel = 'Jugar otra vez',
}: {
    /** Ranked best-first; `entries[0]` is the champion. */
    entries: PodiumEntry[];
    accent: PodiumAccent;
    /** What winning meant here ("Ganador", "Quien menos explotó"…). */
    label: string;
    /** The champion's score, spelled out ("3 bombazos"). */
    caption?: ReactNode;
    onRestart: () => void;
    restartLabel?: string;
}) {
    const champion = entries[0];
    return (
        <div className="flex min-h-0 w-full flex-1 flex-col items-center gap-5 text-center short:gap-3">
            <ConfettiBurst colors={accent.confetti} intensity="final" />

            {/* The hero. It arrives with a spring so the winner LANDS instead of just being there. */}
            <motion.div
                className="shrink-0"
                initial={{ opacity: 0, scale: 0.85, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            >
                <span
                    aria-hidden="true"
                    className={ClassnameHelper.join(
                        'mx-auto flex h-24 w-24 items-center justify-center rounded-full text-5xl ring-1 ring-inset',
                        'short:h-16 short:w-16 short:text-3xl',
                        accent.highlight,
                    )}
                >
                    🏆
                </span>
                <Eyebrow className="mt-4 short:mt-2">{label}</Eyebrow>
                <h1
                    className={ClassnameHelper.join(
                        'mt-1 text-4xl font-extrabold short:text-3xl',
                        accent.text,
                    )}
                >
                    {champion?.name ?? '—'}
                </h1>
                {/* The score as a badge, not a footnote: what the champion actually did to win. */}
                {caption && <Chip className="mt-2">{caption}</Chip>}
            </motion.div>

            {/*
             * The table is the ONLY thing here that can outgrow the screen (a full room of 12),
             * so it is the only thing that scrolls: the champion above and the CTA below stay
             * put. `safe center` keeps a short table optically centred without pushing the first
             * rows out of the top of the scroll box once it does overflow — see `LobbyPanel`.
             */}
            <ol className="flex min-h-0 w-full max-w-md flex-1 flex-col gap-2 overflow-y-auto [justify-content:safe_center]">
                {entries.map((entry, index) => {
                    const isChampion = index === 0;
                    const onPodium = index < 3;
                    const medal = medalOf(index);
                    return (
                        <motion.li
                            key={entry.id}
                            className="shrink-0"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: rowDelay(index), duration: 0.3, ease: 'easeOut' }}
                        >
                            <Surface
                                tone={isChampion ? 'plain' : 'inset'}
                                radius="2xl"
                                className={ClassnameHelper.join(
                                    'flex items-center gap-3 px-4',
                                    // 1st is materially bigger than 4th, not just tinted.
                                    isChampion ? 'py-4 short:py-3' : 'py-3 short:py-2',
                                    isChampion && accent.highlight,
                                )}
                            >
                                <span
                                    className={ClassnameHelper.join(
                                        'flex w-8 shrink-0 justify-center',
                                        medal ? 'text-2xl' : 'font-mono font-bold text-gray-500',
                                    )}
                                >
                                    {medal ?? index + 1}
                                </span>
                                <span
                                    className={ClassnameHelper.join(
                                        'flex-1 truncate text-left font-semibold',
                                        isChampion && 'text-xl',
                                        // Off the podium the name stays legible but recedes.
                                        onPodium ? 'text-white' : 'text-gray-300',
                                    )}
                                >
                                    {entry.name}
                                </span>
                                <span
                                    className={ClassnameHelper.join(
                                        'flex shrink-0 items-baseline gap-1 font-bold tabular-nums',
                                        onPodium ? accent.text : 'text-gray-400',
                                    )}
                                >
                                    <span className={isChampion ? 'text-xl' : undefined}>
                                        {entry.score}
                                    </span>
                                    {entry.unit && (
                                        <span className="text-xs font-medium text-gray-500">
                                            {entry.unit}
                                        </span>
                                    )}
                                </span>
                            </Surface>
                        </motion.li>
                    );
                })}
            </ol>

            {/* Going home is chrome and lives in the `TopBar`; the podium owns exactly one action. */}
            <Button
                variant="accent"
                accentClass={accent.solidButton}
                className="shrink-0"
                onPress={onRestart}
            >
                {restartLabel}
            </Button>
        </div>
    );
}

/**
 * The same ranking, between rounds: a wrapping row of chips, leader tinted. Each live game had
 * its own name for it (`StrikeBoard`, `MiniScoreboard`, and an inline copy in Sintonía's reveal).
 *
 * The group looks at this for about five seconds before the next round starts, so everything here
 * is in service of READ SPEED: the rank is spelled out (🥇🥈🥉, then `4.`) instead of being
 * inferred from the reading order, the value is `tabular-nums` so the numbers line up as the eye
 * sweeps across, and — deliberately — nothing animates. A stagger here would make the one screen
 * that must be instant take a second to arrive.
 */
export function ScoreChips({
    entries,
    accentChip,
}: {
    /** Ranked best-first — `entries[0]` gets the tint. */
    entries: PodiumEntry[];
    accentChip: string;
}) {
    return (
        <div className="flex shrink-0 flex-wrap justify-center gap-2">
            {entries.map((entry, index) => {
                const medal = medalOf(index);
                return (
                    <Chip key={entry.id} className={index === 0 ? accentChip : undefined}>
                        {/* Not decorative, so not `aria-hidden`: the rank is the whole point of
                            the glyph, and a medal announces itself ("1st place medal"). */}
                        <span
                            className={ClassnameHelper.join(
                                'shrink-0',
                                !medal && 'font-mono text-[10px] text-gray-500',
                            )}
                        >
                            {medal ?? `${index + 1}.`}
                        </span>
                        <span className="font-semibold">{entry.name}</span>
                        {/* White + bold is what separates the value from the name here — a `·`
                            would be a fifth thing to fit in a chip, and 12 of these have to wrap
                            onto one line of a TV without becoming a paragraph. */}
                        <span className="font-bold tabular-nums text-white">{entry.score}</span>
                        {entry.unit && <span className="text-[10px] opacity-70">{entry.unit}</span>}
                    </Chip>
                );
            })}
        </div>
    );
}

/** 🏆 / 🥈 / 🥉, then the game's own glyph for everyone else. */
const rankEmoji = (rank: number, fallback: string) =>
    rank === 1 ? '🏆' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : fallback;

/** The headline for a finishing position. Off the podium, the position IS the headline. */
const rankTitle = (rank: number) =>
    rank === 1
        ? '¡Has ganado!'
        : rank === 2
          ? '¡Segundo puesto!'
          : rank === 3
            ? '¡Tercer puesto!'
            : rank > 0
              ? `Puesto ${rank}`
              : 'Fin de la partida';

/**
 * The phone's half of the ending: where I came, and a nudge to look at the real screen.
 *
 * It is the personal version of the podium and is built from the same parts — the medallion, the
 * score-as-a-badge, the spring — so the two screens read as one moment seen from two places. The
 * winner's phone gets its own confetti: the champion is usually the one person NOT looking at the
 * TV in that second, and their result should still feel like something happened.
 */
export function RankCard({
    rank,
    fallbackEmoji,
    accent,
    caption,
}: {
    /** 1-based; `0` when this phone isn't in the ranking (joined late). */
    rank: number;
    fallbackEmoji: string;
    accent: PodiumAccent;
    /** This player's score, spelled out ("12 puntos"). */
    caption?: ReactNode;
}) {
    const won = rank === 1;
    return (
        <>
            {won && <ConfettiBurst colors={accent.confetti} intensity="final" />}
            <motion.div
                className="w-full max-w-sm"
                initial={{ opacity: 0, scale: 0.9, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 240, damping: 20 }}
            >
                <Surface
                    as="section"
                    className="flex flex-col items-center gap-4 p-8 text-center short:gap-3 short:p-6"
                >
                    <span
                        aria-hidden="true"
                        className={ClassnameHelper.join(
                            'flex h-20 w-20 items-center justify-center rounded-full text-4xl ring-1 ring-inset',
                            won ? accent.highlight : 'bg-white/5 ring-white/10',
                        )}
                    >
                        {rankEmoji(rank, fallbackEmoji)}
                    </span>
                    <div>
                        <p
                            className={ClassnameHelper.join(
                                'text-2xl font-extrabold',
                                won ? accent.text : 'text-white',
                            )}
                        >
                            {rankTitle(rank)}
                        </p>
                        {caption && <Chip className="mt-2">{caption}</Chip>}
                    </div>
                    <p className="text-sm text-gray-400">Mira la clasificación en la pantalla 📺</p>
                </Surface>
            </motion.div>
        </>
    );
}
