import { describe, expect, it } from 'vitest';
import type { LivePlayer } from '../_shared/live/live-session';
import { applyScore, pickSpectrums, randomTarget, scoreboard, scoreGuess } from './domain';
import { WAVELENGTH_SPECTRUMS } from './spectrums';

describe('sintonia domain', () => {
    it('pickSpectrums returns the requested count of distinct real spectrums', () => {
        const picked = pickSpectrums(5);
        expect(picked).toHaveLength(5);
        expect(new Set(picked.map((s) => s.left + s.right)).size).toBe(5);
        expect(picked.every((s) => WAVELENGTH_SPECTRUMS.includes(s))).toBe(true);
    });

    it('randomTarget always fits inside the track (10–90)', () => {
        for (let i = 0; i < 500; i++) {
            const t = randomTarget();
            expect(t).toBeGreaterThanOrEqual(10);
            expect(t).toBeLessThanOrEqual(90);
        }
    });

    it('scoreGuess awards bullseye/near/close/miss bands symmetrically', () => {
        expect(scoreGuess(50, 50)).toBe(4); // dead centre
        expect(scoreGuess(50, 54)).toBe(4); // within 4
        expect(scoreGuess(50, 46)).toBe(4);
        expect(scoreGuess(50, 59)).toBe(3); // within 9
        expect(scoreGuess(50, 41)).toBe(3);
        expect(scoreGuess(50, 66)).toBe(2); // within 16
        expect(scoreGuess(50, 34)).toBe(2);
        expect(scoreGuess(50, 70)).toBe(0); // miss
        expect(scoreGuess(50, 10)).toBe(0);
    });

    it('applyScore accumulates points per seat', () => {
        let scores: Record<number, number> = {};
        scores = applyScore(scores, 2, 3);
        scores = applyScore(scores, 2, 4);
        scores = applyScore(scores, 1, 2);
        expect(scores).toEqual({ 1: 2, 2: 7 });
    });

    it('scoreboard ranks by score desc, seat asc on ties', () => {
        const players: LivePlayer[] = [
            { seat: 1, name: 'Ana' },
            { seat: 2, name: 'Bea' },
            { seat: 3, name: 'Caro' },
        ];
        const board = scoreboard(players, { 1: 5, 2: 5, 3: 9 });
        expect(board.map((s) => s.seat)).toEqual([3, 1, 2]); // 9, then 5/5 tie -> seat asc
    });
});
