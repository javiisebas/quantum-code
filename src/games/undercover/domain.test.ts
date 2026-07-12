import { describe, it, expect } from 'vitest';
import { buildUndercover, WORD_PAIRS } from './domain';

/** Expected number of impostors for a given player count. */
const expectedUndercovers = (count: number): number => (count < 7 ? 1 : 2);

describe('buildUndercover', () => {
    const counts = [3, 6, 7, 12];

    for (const count of counts) {
        it(`deals a valid room for ${count} players across many runs`, () => {
            for (let run = 0; run < 200; run++) {
                const room = buildUndercover(count);

                // One word per seat, all non-empty.
                expect(room.wordBySeat).toHaveLength(count);
                for (const word of room.wordBySeat) {
                    expect(typeof word).toBe('string');
                    expect(word.length).toBeGreaterThan(0);
                }

                // Exactly the expected number of undercovers, distinct and in range.
                expect(room.undercoverSeats).toHaveLength(expectedUndercovers(count));
                const unique = new Set(room.undercoverSeats);
                expect(unique.size).toBe(room.undercoverSeats.length);
                for (const seat of room.undercoverSeats) {
                    expect(Number.isInteger(seat)).toBe(true);
                    expect(seat).toBeGreaterThanOrEqual(1);
                    expect(seat).toBeLessThanOrEqual(count);
                }

                // undercoverSeats are sorted ascending.
                const sorted = [...room.undercoverSeats].sort((a, b) => a - b);
                expect(room.undercoverSeats).toEqual(sorted);

                // The non-undercover seats all share the same civilian word.
                const undercoverSet = new Set(room.undercoverSeats);
                const civilianWords = room.wordBySeat.filter(
                    (_, i) => !undercoverSet.has(i + 1),
                );
                const civilianWord = civilianWords[0];
                for (const word of civilianWords) {
                    expect(word).toBe(civilianWord);
                }

                // The undercover word differs from the civilian word, and it is a real pair.
                const undercoverWord = room.wordBySeat[room.undercoverSeats[0] - 1];
                expect(undercoverWord).not.toBe(civilianWord);
                for (const seat of room.undercoverSeats) {
                    expect(room.wordBySeat[seat - 1]).toBe(undercoverWord);
                }
                const pair = WORD_PAIRS.find(
                    (p) => p.civilian === civilianWord && p.undercover === undercoverWord,
                );
                expect(pair).toBeDefined();
            }
        });
    }
});
