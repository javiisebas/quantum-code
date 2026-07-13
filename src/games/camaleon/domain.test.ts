import { describe, it, expect } from 'vitest';
import { buildCamaleon } from './domain';
import { CHAMELEON_TOPICS } from './topics';

describe('buildCamaleon', () => {
    const counts = [3, 6, 12];

    for (const count of counts) {
        it(`deals a valid room for ${count} players across many runs`, () => {
            for (let run = 0; run < 200; run++) {
                const room = buildCamaleon(count);

                // Exactly 16 words in the grid, all non-empty and all distinct.
                expect(room.grid).toHaveLength(16);
                for (const word of room.grid) {
                    expect(typeof word).toBe('string');
                    expect(word.length).toBeGreaterThan(0);
                }
                expect(new Set(room.grid).size).toBe(16);

                // The grid is a permutation of a real topic's 16 words (same multiset).
                const topic = CHAMELEON_TOPICS.find((t) => t.theme === room.theme);
                expect(topic).toBeDefined();
                expect([...room.grid].sort()).toEqual([...topic!.words].sort());

                // secretIndex is an integer in 0..15.
                expect(Number.isInteger(room.secretIndex)).toBe(true);
                expect(room.secretIndex).toBeGreaterThanOrEqual(0);
                expect(room.secretIndex).toBeLessThanOrEqual(15);

                // chameleonSeat is an integer in 1..count.
                expect(Number.isInteger(room.chameleonSeat)).toBe(true);
                expect(room.chameleonSeat).toBeGreaterThanOrEqual(1);
                expect(room.chameleonSeat).toBeLessThanOrEqual(count);
            }
        });
    }
});
