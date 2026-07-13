import { describe, expect, it } from 'vitest';
import type { LivePlayer } from '../_shared/live/live-session';
import {
    applyRoundScores,
    buildAnswers,
    BLANK_ANSWER,
    pickPrompts,
    POINTS_PER_VOTE,
    revealAnswers,
    roundWinners,
    scoreboard,
    tallyVotes,
    TOTAL_ROUNDS,
} from './domain';
import { CHISPAS_PROMPTS } from './prompts';

const players: LivePlayer[] = [
    { seat: 1, name: 'Ana' },
    { seat: 2, name: 'Bea' },
    { seat: 3, name: 'Caro' },
];

describe('chispas domain', () => {
    describe('pickPrompts', () => {
        it('returns the requested number of distinct prompts from the pool', () => {
            const picked = pickPrompts(TOTAL_ROUNDS);
            expect(picked).toHaveLength(TOTAL_ROUNDS);
            expect(new Set(picked).size).toBe(TOTAL_ROUNDS);
            expect(picked.every((p) => CHISPAS_PROMPTS.includes(p))).toBe(true);
        });
    });

    describe('buildAnswers', () => {
        it('includes every player, replacing missing answers with the blank placeholder', () => {
            const answers = buildAnswers(players, { 1: { text: 'uno' }, 3: { text: '  ' } });
            expect(answers).toHaveLength(3);
            const bySeat = new Map(answers.map((a) => [a.seat, a.text]));
            expect(bySeat.get(1)).toBe('uno');
            expect(bySeat.get(2)).toBe(BLANK_ANSWER); // never submitted
            expect(bySeat.get(3)).toBe(BLANK_ANSWER); // whitespace only
            // ids are 0-based and unique.
            expect(new Set(answers.map((a) => a.id))).toEqual(new Set([0, 1, 2]));
        });
    });

    describe('tallyVotes', () => {
        const answers = [
            { id: 0, text: 'a', seat: 1, name: 'Ana' },
            { id: 1, text: 'b', seat: 2, name: 'Bea' },
            { id: 2, text: 'c', seat: 3, name: 'Caro' },
        ];

        it('counts votes per answer id', () => {
            const counts = tallyVotes(answers, {
                1: { choice: 1 }, // Ana -> Bea
                3: { choice: 1 }, // Caro -> Bea
                2: { choice: 0 }, // Bea -> Ana
            });
            expect(counts).toEqual({ 0: 1, 1: 2, 2: 0 });
        });

        it('never counts a self-vote', () => {
            const counts = tallyVotes(answers, {
                2: { choice: 1 }, // Bea votes her OWN answer (id 1, seat 2) -> ignored
                1: { choice: 1 }, // Ana -> Bea, valid
            });
            expect(counts).toEqual({ 0: 0, 1: 1, 2: 0 });
        });

        it('ignores unknown or empty choices', () => {
            const counts = tallyVotes(answers, {
                1: { choice: 99 }, // no such answer
                2: {}, // no choice
                3: { choice: 0 }, // valid
            });
            expect(counts).toEqual({ 0: 1, 1: 0, 2: 0 });
        });
    });

    describe('revealAnswers + roundWinners', () => {
        const answers = [
            { id: 0, text: 'a', seat: 1, name: 'Ana' },
            { id: 1, text: 'b', seat: 2, name: 'Bea' },
            { id: 2, text: 'c', seat: 3, name: 'Caro' },
        ];

        it('sorts most-voted first and finds the winner', () => {
            const reveal = revealAnswers(answers, { 0: 1, 1: 3, 2: 0 });
            expect(reveal.map((r) => r.seat)).toEqual([2, 1, 3]); // votes 3, 1, 0
            expect(reveal[0]).toMatchObject({ seat: 2, votes: 3 });
            expect(roundWinners(reveal)).toEqual([2]);
        });

        it('returns all tied winners', () => {
            const reveal = revealAnswers(answers, { 0: 2, 1: 2, 2: 0 });
            expect(roundWinners(reveal).sort()).toEqual([1, 2]);
        });

        it('has no winner when nobody got a vote', () => {
            const reveal = revealAnswers(answers, { 0: 0, 1: 0, 2: 0 });
            expect(roundWinners(reveal)).toEqual([]);
        });
    });

    describe('applyRoundScores + scoreboard', () => {
        it('adds votes×points to running scores and ranks players', () => {
            const reveal = revealAnswers(
                [
                    { id: 0, text: 'a', seat: 1, name: 'Ana' },
                    { id: 1, text: 'b', seat: 2, name: 'Bea' },
                    { id: 2, text: 'c', seat: 3, name: 'Caro' },
                ],
                { 0: 1, 1: 2, 2: 0 },
            );
            // Ana carries 50 from earlier; this round Ana +1 vote, Bea +2 votes, Caro +0.
            const scores = applyRoundScores({ 1: 50 }, reveal);
            expect(scores).toEqual({
                1: 50 + 1 * POINTS_PER_VOTE, // 150
                2: 2 * POINTS_PER_VOTE, // 200
                3: 0,
            });

            const board = scoreboard(players, scores);
            expect(board.map((s) => s.seat)).toEqual([2, 1, 3]); // 200, 150, 0
            expect(board[0]).toMatchObject({ name: 'Bea', score: 200 });
        });
    });
});
