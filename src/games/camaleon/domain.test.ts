import { describe, it, expect } from 'vitest';
import { buildCamaleon, projectCamaleon } from './domain';
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

describe('seat projection (sealing)', () => {
    const counts = [3, 4, 5, 6, 7, 8];

    for (const count of counts) {
        it(`seals every seat's view so the Chameleon and the secret never leak for ${count} players`, () => {
            // Accumulated so the RNG is proven to move the Chameleon across seats.
            const chameleonSeatsSeen = new Set<number>();

            for (let run = 0; run < 200; run++) {
                const room = buildCamaleon(count);
                chameleonSeatsSeen.add(room.chameleonSeat);

                for (let seat = 1; seat <= count; seat++) {
                    const view = projectCamaleon(room, seat);
                    // Cast to a record so the "must NOT be present" checks can probe
                    // fields the discriminated union would refuse to even type.
                    const v = view as Record<string, unknown>;

                    if (seat === room.chameleonSeat) {
                        // Exactly the Chameleon's seat gets the 'chameleon' view...
                        expect(view.kind).toBe('chameleon');
                        // ...which must NEVER reveal the secret cell — the whole point
                        // is that the Chameleon has to deduce it.
                        expect('secretIndex' in v).toBe(false);
                    } else {
                        // Every other seat is a plain 'player' who learns the secret.
                        expect(view.kind).toBe('player');
                        if (view.kind === 'player') {
                            expect(view.secretIndex).toBe(room.secretIndex);
                        }
                    }

                    // Theme and board are PUBLIC — present and correct on both views.
                    expect(view.theme).toBe(room.theme);
                    expect(view.grid).toEqual(room.grid);

                    // THE SEAL: no phone — Chameleon or player — is ever told who the
                    // Chameleon is.
                    expect('chameleonSeat' in v).toBe(false);
                }
            }

            expect(chameleonSeatsSeen.size).toBeGreaterThan(1);
        });
    }
});
