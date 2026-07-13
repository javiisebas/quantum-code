/**
 * Chispas ("¡a ver quién es más gracioso!") domain — a Quiplash-style laugh game on the
 * live channel. Every round: the host shows ONE prompt, every phone types a funny answer,
 * then everyone votes for the funniest (you can't vote your own). Points = votes × 100.
 * After a few rounds, the funniest player wins.
 *
 * This module is the pure, testable core: prompt selection, self-vote-guarded tallying and
 * scoring. All randomness/IO lives in the host component; these functions are deterministic
 * given their inputs.
 */

import type { LivePlayer } from '../_shared/live/live-session';
import { CHISPAS_PROMPTS } from './prompts';

export type ChispasPhase = 'answer' | 'vote' | 'reveal' | 'final';

/** Default number of prompt rounds in a game (kept short so it stays punchy). */
export const TOTAL_ROUNDS = 3;

/** Points awarded per vote an answer receives. */
export const POINTS_PER_VOTE = 100;

/** Placeholder text for a player who ran out of time without answering. */
export const BLANK_ANSWER = '🦗 (se quedó en blanco)';

/** A collected answer with its author (host-side; authorship is hidden from phones until reveal). */
export interface ChispasAnswer {
    /** Stable id within the round (index into the shuffled answer list). */
    id: number;
    text: string;
    seat: number;
    name: string;
}

/** An answer as revealed: author + how many votes it won. */
export interface RevealAnswer extends ChispasAnswer {
    votes: number;
}

/** An answer as shown to phones during voting — anonymized (no author). */
export interface AnswerView {
    id: number;
    text: string;
}

/**
 * The public game snapshot the host publishes and phones poll. Only ever carries what
 * each phase should reveal: during 'vote' answers are anonymized (no `seat`), authors
 * appear only from 'reveal' onward.
 */
export interface ChispasState {
    phase: ChispasPhase;
    /** Per-game generation (bumped by "Jugar otra vez"), namespaces the input buckets. */
    gen: number;
    round: number;
    totalRounds: number;
    prompt: string;
    players: LivePlayer[];
    /** 'vote' phase: the answers to vote on, anonymized and shuffled. */
    answers?: AnswerView[];
    /** 'reveal' phase: answers with authors + vote counts, most-voted first. */
    reveal?: RevealAnswer[];
    /** 'reveal' phase: seat(s) that won the round (for celebration). */
    winnerSeats?: number[];
    /** 'reveal' + 'final' phases: cumulative scoreboard, highest first. */
    scores?: Score[];
}

/** A cumulative score line. */
export interface Score {
    seat: number;
    name: string;
    score: number;
}

// ---------------------------------------------------------------------------
// Input bucket ids (see live-store `round`). Roster is 0; gameplay uses positive
// buckets keyed by round so answers and votes never collide across phases/rounds.
// ---------------------------------------------------------------------------

/**
 * Input buckets, namespaced by a per-game generation so "Jugar otra vez" (which reuses the
 * SAME room and therefore repeats round numbers 1..N) never reads the previous game's answers
 * or votes. `gen` increments each restart; kept < 9 so `gen*1000 + …` stays under the input
 * route's round ceiling.
 */
export const answerRound = (gen: number, round: number): number => (gen % 9) * 1000 + 100 + round;
/** Input bucket where phones write `{ choice }` (an answer id) for a round's vote. */
export const voteRound = (gen: number, round: number): number => (gen % 9) * 1000 + 200 + round;

const shuffle = <T>(items: T[]): T[] => {
    const copy = items.slice();
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
};

/** Pick `count` distinct random prompts for a game. */
export const pickPrompts = (count: number): string[] => shuffle(CHISPAS_PROMPTS).slice(0, count);

/**
 * Build the round's answer list from the collected answer inputs. Every roster player is
 * included (a missing/blank answer becomes the "blank" placeholder so nobody is silently
 * dropped and everyone still gets voted on), then the list is shuffled and given stable ids.
 */
export const buildAnswers = (
    players: LivePlayer[],
    inputs: Record<number, { text?: string }>,
): ChispasAnswer[] => {
    const raw = players.map((player) => {
        const text = (inputs[player.seat]?.text ?? '').trim();
        return {
            seat: player.seat,
            name: player.name,
            text: text.length > 0 ? text : BLANK_ANSWER,
        };
    });
    return shuffle(raw).map((answer, index) => ({ ...answer, id: index }));
};

/**
 * Tally votes per answer id, IGNORING self-votes (a player can never score their own
 * answer, even if their phone somehow submitted it). `votes` maps voter seat → `{ choice }`.
 */
export const tallyVotes = (
    answers: ChispasAnswer[],
    votes: Record<number, { choice?: number }>,
): Record<number, number> => {
    const seatById = new Map(answers.map((a) => [a.id, a.seat]));
    const counts: Record<number, number> = {};
    for (const answer of answers) counts[answer.id] = 0;

    for (const [voterStr, vote] of Object.entries(votes)) {
        const voterSeat = Number(voterStr);
        const choice = vote?.choice;
        if (choice === undefined || !seatById.has(choice)) continue; // unknown/empty vote
        if (seatById.get(choice) === voterSeat) continue; // self-vote never counts
        counts[choice] += 1;
    }
    return counts;
};

/** Answers with their vote counts, sorted most-voted first (stable within ties by id). */
export const revealAnswers = (
    answers: ChispasAnswer[],
    counts: Record<number, number>,
): RevealAnswer[] =>
    answers
        .map((answer) => ({ ...answer, votes: counts[answer.id] ?? 0 }))
        .sort((a, b) => b.votes - a.votes || a.id - b.id);

/** Seats of the answer(s) with the most votes this round (empty if nobody got a vote). */
export const roundWinners = (reveal: RevealAnswer[]): number[] => {
    const top = reveal[0]?.votes ?? 0;
    if (top <= 0) return [];
    return reveal.filter((r) => r.votes === top).map((r) => r.seat);
};

/** Add this round's votes×points to the running scores, keyed by seat. */
export const applyRoundScores = (
    scores: Record<number, number>,
    reveal: RevealAnswer[],
): Record<number, number> => {
    const next = { ...scores };
    for (const answer of reveal) {
        next[answer.seat] = (next[answer.seat] ?? 0) + answer.votes * POINTS_PER_VOTE;
    }
    return next;
};

/** Cumulative scoreboard for the roster, highest first. */
export const scoreboard = (players: LivePlayer[], scores: Record<number, number>): Score[] =>
    players
        .map((player) => ({
            seat: player.seat,
            name: player.name,
            score: scores[player.seat] ?? 0,
        }))
        .sort((a, b) => b.score - a.score || a.seat - b.seat);
