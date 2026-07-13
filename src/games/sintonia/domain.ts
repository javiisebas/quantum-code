/**
 * Sintonía ("¿estáis en la misma onda?") domain — a Wavelength-style game on the live
 * channel. Each round one player (the psychic, rotating) secretly sees a target zone on a
 * spectrum between two opposite poles, and gives a one-word clue out loud; the rest move a
 * dial on the shared screen to guess where the target is. The closer they land, the more
 * points the psychic scores. After everyone has been the psychic, the best clue-giver wins.
 *
 * Pure, testable core: spectrum/target selection and closeness scoring. The dial and all
 * randomness/IO live in the host component.
 */

import type { LivePlayer } from '../_shared/live/live-session';
import { WAVELENGTH_SPECTRUMS, type Spectrum } from './spectrums';

export type SintoniaPhase = 'clue' | 'guess' | 'reveal' | 'final';

/** Half-width (in %) of the bullseye zone around the target center. */
export const TARGET_HALF_WIDTH = 8;

/** A cumulative score line. */
export interface Score {
    seat: number;
    name: string;
    score: number;
}

/**
 * Public game snapshot the host publishes and phones poll. `target` is the secret zone
 * center: during clue/guess it is delivered ONLY to the psychic over the per-seat private
 * channel and is absent from this public state, so no other phone can read it; it enters
 * the public snapshot only at reveal, when everyone is meant to see it. The host screen
 * never shows the target before reveal.
 */
export interface SintoniaState {
    phase: SintoniaPhase;
    round: number;
    totalRounds: number;
    spectrum: Spectrum;
    psychic: LivePlayer;
    /** 0–100, the centre of the target zone. Public only at reveal (private to the psychic before). */
    target?: number;
    /** 'reveal': where the team's dial landed. */
    dial?: number;
    /** 'reveal': points the psychic scored this round. */
    points?: number;
    /** 'reveal' + 'final': cumulative scoreboard, highest first. */
    scores?: Score[];
}

const shuffle = <T>(items: T[]): T[] => {
    const copy = items.slice();
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
};

/** Pick `count` distinct random spectrums for a game. */
export const pickSpectrums = (count: number): Spectrum[] =>
    shuffle(WAVELENGTH_SPECTRUMS).slice(0, count);

/** A random target centre, kept away from the extremes so the zone always fits (10–90). */
export const randomTarget = (): number => 10 + Math.floor(Math.random() * 81);

/**
 * Score a guess by closeness (Wavelength-style bands): bullseye 4, near 3, close 2, else 0.
 * Symmetric around the target centre.
 */
export const scoreGuess = (target: number, dial: number): number => {
    const distance = Math.abs(dial - target);
    if (distance <= 4) return 4;
    if (distance <= 9) return 3;
    if (distance <= 16) return 2;
    return 0;
};

/** Add a round's points to a psychic's running score. */
export const applyScore = (
    scores: Record<number, number>,
    seat: number,
    points: number,
): Record<number, number> => ({ ...scores, [seat]: (scores[seat] ?? 0) + points });

/** Cumulative scoreboard for the roster, highest first. */
export const scoreboard = (players: LivePlayer[], scores: Record<number, number>): Score[] =>
    players
        .map((player) => ({ seat: player.seat, name: player.name, score: scores[player.seat] ?? 0 }))
        .sort((a, b) => b.score - a.score || a.seat - b.seat);
