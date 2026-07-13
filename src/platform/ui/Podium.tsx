'use client';

import { Button } from '@/platform/ui/Button';
import { Chip } from '@/platform/ui/Chip';
import { ConfettiBurst } from '@/platform/ui/Confetti';
import { Eyebrow } from '@/platform/ui/Eyebrow';
import { Surface } from '@/platform/ui/Surface';
import { ClassnameHelper } from '@/platform/util/classnames';
import { ReactNode } from 'react';

/**
 * How every game in the arcade ends, on both screens:
 *
 *  - `<Podium>` on the shared screen — confetti, the champion, the ranked table, "jugar otra vez".
 *  - `<RankCard>` on the phone — "did I win, and where did I come?".
 *
 * Both were copy-pasted once per live game (three near-identical `FinalStage`s, three
 * near-identical final phone cards) and drifted: one podium tinted the leader row, another
 * hard-coded `text-cyan-300` where the accent token said the same thing, a third used a different
 * trophy size. The only real differences were the accent and how a score reads (`💣 3` vs `12
 * puntos`) — so those are the props, and everything else is fixed.
 *
 * A `platform/` component never reaches into a game's colour tokens: the accent arrives as plain
 * class strings (the same contract `<Button variant="accent">` uses), and `AccentClasses` from
 * `games/_shared/accents` satisfies it structurally, so a game just passes `accent={acc}`.
 */
export interface PodiumAccent {
    /** Accent-tinted text (champion name, score column). */
    text: string;
    /** Leader-row tint: background + ring colour. */
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
    /** The score cell, rendered as-is so each game keeps its own unit (`💣 3`, `12`). */
    score: ReactNode;
}

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
        <div className="flex min-h-0 w-full flex-1 flex-col items-center gap-5 text-center">
            <ConfettiBurst colors={accent.confetti} />

            <div className="shrink-0">
                <span className="text-6xl short:text-5xl" aria-hidden="true">
                    🏆
                </span>
                <Eyebrow className="mt-3">{label}</Eyebrow>
                <h1
                    className={ClassnameHelper.join(
                        'mt-1 text-4xl font-extrabold short:text-3xl',
                        accent.text,
                    )}
                >
                    {champion?.name ?? '—'}
                </h1>
                {caption && <p className="mt-1 text-sm text-gray-400">{caption}</p>}
            </div>

            {/*
             * The table is the ONLY thing here that can outgrow the screen (a full room of 12),
             * so it is the only thing that scrolls: the champion above and the CTA below stay
             * put. `safe center` keeps a short table optically centred without pushing the first
             * rows out of the top of the scroll box once it does overflow — see `LobbyPanel`.
             */}
            <ol className="flex min-h-0 w-full max-w-sm flex-1 flex-col gap-2 overflow-y-auto [justify-content:safe_center]">
                {entries.map((entry, index) => (
                    <li key={entry.id} className="shrink-0">
                        <Surface
                            tone={index === 0 ? 'plain' : 'inset'}
                            radius="2xl"
                            className={ClassnameHelper.join(
                                'flex items-center gap-3 p-3',
                                index === 0 && accent.highlight,
                            )}
                        >
                            <span className="w-6 text-center font-mono text-lg font-bold text-gray-400">
                                {index + 1}
                            </span>
                            <span className="flex-1 truncate text-left font-semibold text-white">
                                {entry.name}
                            </span>
                            <span className={ClassnameHelper.join('font-bold', accent.text)}>
                                {entry.score}
                            </span>
                        </Surface>
                    </li>
                ))}
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
            {entries.map((entry, index) => (
                <Chip key={entry.id} className={index === 0 ? accentChip : undefined}>
                    <span className="font-semibold">{entry.name}</span>
                    <span className="text-gray-400">·</span>
                    <span>{entry.score}</span>
                </Chip>
            ))}
        </div>
    );
}

/** 🏆 / 🥈 / 🥉, then the game's own glyph for everyone else. */
const rankEmoji = (rank: number, fallback: string) =>
    rank === 1 ? '🏆' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : fallback;

/** The phone's half of the ending: where I came, and a nudge to look at the real screen. */
export function RankCard({
    rank,
    fallbackEmoji,
    caption,
}: {
    /** 1-based; `0` when this phone isn't in the ranking (joined late). */
    rank: number;
    fallbackEmoji: string;
    /** This player's score, spelled out ("12 puntos"). */
    caption?: ReactNode;
}) {
    return (
        <Surface as="section" className="w-full max-w-sm p-8 text-center">
            <span className="text-5xl" aria-hidden="true">
                {rankEmoji(rank, fallbackEmoji)}
            </span>
            <p className="mt-3 text-2xl font-extrabold text-white">
                {rank === 1 ? '¡Has ganado!' : `Puesto ${rank || '—'}`}
            </p>
            {caption && <p className="mt-1 text-sm text-gray-400">{caption}</p>}
            <p className="mt-4 text-sm text-gray-400">Mira la clasificación en la pantalla 📺</p>
        </Surface>
    );
}
