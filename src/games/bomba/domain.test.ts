import { describe, expect, it } from 'vitest';
import type { LivePlayer } from '../_shared/live/live-session';
import { BOMBA_CATEGORIES } from './categories';
import {
    applyExplosion,
    initGame,
    MAX_FUSE_MS,
    MIN_FUSE_MS,
    nextHolder,
    nextRound,
    passBomb,
    passRound,
    pickCategory,
    randomFuse,
    randomSeat,
    scoreboard,
} from './domain';

describe('bomba domain', () => {
    it('randomFuse always lands within [MIN_FUSE_MS, MAX_FUSE_MS]', () => {
        for (let i = 0; i < 1000; i++) {
            const fuse = randomFuse();
            expect(Number.isInteger(fuse)).toBe(true);
            expect(fuse).toBeGreaterThanOrEqual(MIN_FUSE_MS);
            expect(fuse).toBeLessThanOrEqual(MAX_FUSE_MS);
        }
    });

    it('randomSeat only ever returns a seat from the roster', () => {
        const seats = [1, 4, 7, 9];
        for (let i = 0; i < 500; i++) {
            expect(seats).toContain(randomSeat(seats));
        }
    });

    it('nextHolder wraps around and never returns a non-seat', () => {
        const seats = [1, 3, 4, 8];
        expect(nextHolder(1, seats)).toBe(3);
        expect(nextHolder(3, seats)).toBe(4);
        expect(nextHolder(4, seats)).toBe(8);
        expect(nextHolder(8, seats)).toBe(1); // wrap
        // From every seat, the next is always another real seat.
        for (const seat of seats) {
            expect(seats).toContain(nextHolder(seat, seats));
        }
        // An unknown current seat falls back to the first seat (never undefined).
        expect(nextHolder(99, seats)).toBe(1);
    });

    it('nextHolder visits every seat exactly once per lap', () => {
        const seats = [2, 5, 6, 10, 11];
        const visited: number[] = [];
        let current = seats[0];
        for (let i = 0; i < seats.length; i++) {
            visited.push(current);
            current = nextHolder(current, seats);
        }
        expect(current).toBe(seats[0]); // back to the start after a full lap
        expect(new Set(visited)).toEqual(new Set(seats));
    });

    it('pickCategory returns a real category and avoids repeats until exhausted', () => {
        // Accumulate `used` across a full pass over the deck: every pick must be fresh.
        const used: string[] = [];
        for (let i = 0; i < BOMBA_CATEGORIES.length; i++) {
            const picked = pickCategory(used);
            expect(BOMBA_CATEGORIES).toContain(picked);
            expect(used).not.toContain(picked); // no repeat while the deck has cards left
            used.push(picked);
        }
        expect(new Set(used).size).toBe(BOMBA_CATEGORIES.length); // saw them all, no dupes
        // Deck exhausted → falls back to the full list rather than failing.
        expect(BOMBA_CATEGORIES).toContain(pickCategory(used));
    });

    it('applyExplosion increments only the holder, leaving everyone else untouched', () => {
        const before = { 1: 2, 2: 0, 3: 1 };
        const after = applyExplosion(before, 2);
        expect(after).toEqual({ 1: 2, 2: 1, 3: 1 });
        expect(before).toEqual({ 1: 2, 2: 0, 3: 1 }); // pure — input not mutated
        // A holder with no prior strikes goes from absent to 1.
        expect(applyExplosion({}, 5)).toEqual({ 5: 1 });
        // Repeated explosions on the same seat accumulate.
        expect(applyExplosion(applyExplosion({}, 3), 3)).toEqual({ 3: 2 });
    });

    it('passBomb advances exactly one seat and bumps the pass counter', () => {
        const game = initGame(4, [1, 2, 3]);
        const from = game.holderSeat;
        const passed = passBomb(game);
        expect(passed.holderSeat).toBe(nextHolder(from, game.seats));
        expect(passed.pass).toBe(game.pass + 1);
        // Three passes around a 3-seat table return to the starting holder.
        const lap = passBomb(passBomb(passBomb(game)));
        expect(lap.holderSeat).toBe(from);
        expect(lap.pass).toBe(3);
    });

    it('nextRound picks an unused category and resets the pass counter, or ends the game', () => {
        let game = initGame(3, [1, 2, 3]);
        expect(game.round).toBe(1);
        for (let round = 2; round <= 3; round++) {
            game = { ...game, pass: 7, lastExploded: 2 };
            game = nextRound(game);
            expect(game.round).toBe(round);
            expect(game.phase).toBe('playing');
            expect(game.pass).toBe(0);
            expect(game.lastExploded).toBeNull();
            expect(game.usedCategories).toContain(game.category);
            expect(game.usedCategories).toHaveLength(round);
            expect(new Set(game.usedCategories).size).toBe(round); // no category repeated
        }
        // Past the last round → 'final'.
        const done = nextRound(game);
        expect(done.phase).toBe('final');
        expect(done.round).toBe(3); // stays on the last round number
    });

    it('initGame starts a valid round 1 with a random holder from the roster', () => {
        const seats = [1, 2, 3, 4];
        for (let i = 0; i < 200; i++) {
            const game = initGame(5, seats);
            expect(game.round).toBe(1);
            expect(game.phase).toBe('playing');
            expect(game.pass).toBe(0);
            expect(game.totalRounds).toBe(5);
            expect(game.strikes).toEqual({});
            expect(game.lastExploded).toBeNull();
            expect(seats).toContain(game.holderSeat);
            expect(BOMBA_CATEGORIES).toContain(game.category);
            expect(game.usedCategories).toEqual([game.category]);
        }
    });

    it('passRound namespaces buckets per generation and stays under the round ceiling', () => {
        expect(passRound(0, 1)).toBe(101);
        expect(passRound(0, 1)).not.toBe(0); // never collides with the roster bucket (0)
        // Different generations never share a bucket for the same round.
        expect(passRound(0, 3)).not.toBe(passRound(1, 3));
        // Bounded well under the input route's MAX_ROUND (10_000) for every legal gen/round.
        for (let gen = 0; gen < 30; gen++) {
            for (let round = 1; round <= 12; round++) {
                const bucket = passRound(gen, round);
                expect(bucket).toBeGreaterThan(0);
                expect(bucket).toBeLessThan(10_000);
            }
        }
    });

    it('scoreboard ranks by strikes asc, then seat asc on ties', () => {
        const players: LivePlayer[] = [
            { seat: 1, name: 'Ana' },
            { seat: 2, name: 'Bea' },
            { seat: 3, name: 'Caro' },
        ];
        const board = scoreboard(players, { 1: 2, 2: 0, 3: 2 });
        // 0 strikes first; then the 2/2 tie breaks by seat ascending (1 before 3).
        expect(board.map((s) => s.seat)).toEqual([2, 1, 3]);
        expect(board.map((s) => s.strikes)).toEqual([0, 2, 2]);
    });

    it('scoreboard defaults missing seats to zero strikes and keeps names', () => {
        const players: LivePlayer[] = [
            { seat: 4, name: 'Dani' },
            { seat: 2, name: 'Bea' },
        ];
        const board = scoreboard(players, { 4: 1 });
        expect(board).toEqual([
            { seat: 2, name: 'Bea', strikes: 0 },
            { seat: 4, name: 'Dani', strikes: 1 },
        ]);
    });

    it('an all-tied board falls back to pure seat-ascending order', () => {
        const players: LivePlayer[] = [
            { seat: 3, name: 'C' },
            { seat: 1, name: 'A' },
            { seat: 2, name: 'B' },
        ];
        expect(scoreboard(players, {}).map((s) => s.seat)).toEqual([1, 2, 3]);
    });
});
