import { describe, it, expect } from 'vitest';
import { buildSpyfall, SPYFALL_LOCATIONS, SPYFALL_LOCATION_NAMES } from './domain';
import { spyfallManifest, validateSpyfallPayload } from './manifest';

describe('SPYFALL_LOCATIONS pool', () => {
    it('is well-formed: unique named locations, each with non-empty distinct roles', () => {
        expect(SPYFALL_LOCATIONS.length).toBeGreaterThan(0);

        const names = SPYFALL_LOCATIONS.map((l) => l.name);
        // Location names are unique (players reason over a distinct list).
        expect(new Set(names).size).toBe(names.length);

        for (const location of SPYFALL_LOCATIONS) {
            expect(typeof location.name).toBe('string');
            expect(location.name.length).toBeGreaterThan(0);

            // Every location ships at least one role, all non-empty and distinct.
            expect(location.roles.length).toBeGreaterThan(0);
            for (const role of location.roles) {
                expect(typeof role).toBe('string');
                expect(role.length).toBeGreaterThan(0);
            }
            expect(new Set(location.roles).size).toBe(location.roles.length);
        }
    });

    it('SPYFALL_LOCATION_NAMES mirrors the pool names in order', () => {
        expect(SPYFALL_LOCATION_NAMES).toEqual(SPYFALL_LOCATIONS.map((l) => l.name));
    });
});

describe('buildSpyfall', () => {
    // Span the manifest's min..max range, deliberately including counts below,
    // equal to, and above a location's role-list length so the `roles[i % len]`
    // cycling path is exercised (locations ship 5 roles).
    const counts = [
        spyfallManifest.minPlayers, // 3
        4,
        5,
        6,
        8,
        spyfallManifest.maxPlayers, // 12
    ];

    for (const count of counts) {
        it(`deals a valid room for ${count} players across many runs`, () => {
            // Accumulated across runs to prove the RNG actually varies its output.
            const spySeatsSeen = new Set<number>();
            const locationsSeen = new Set<string>();

            for (let run = 0; run < 200; run++) {
                const room = buildSpyfall(count);

                // The published payload passes the manifest's own validator.
                expect(validateSpyfallPayload(room)).toBe(true);

                // Exactly one role per seat.
                expect(room.roleBySeat).toHaveLength(count);

                // The location is a real entry from the pool.
                const location = SPYFALL_LOCATIONS.find((l) => l.name === room.location);
                expect(location).toBeDefined();
                expect(SPYFALL_LOCATION_NAMES).toContain(room.location);

                // Exactly ONE spy: a single 1-based seat inside [1, count].
                expect(Number.isInteger(room.spySeat)).toBe(true);
                expect(room.spySeat).toBeGreaterThanOrEqual(1);
                expect(room.spySeat).toBeLessThanOrEqual(count);

                // Every seat's role is drawn from the chosen location's role list.
                // (The spy's own card is ignored at play time, but is still a real
                // role string — so this holds for spy and non-spy seats alike.)
                const roleSet = new Set(location!.roles);
                for (const role of room.roleBySeat) {
                    expect(typeof role).toBe('string');
                    expect(role.length).toBeGreaterThan(0);
                    expect(roleSet.has(role)).toBe(true);
                }

                // Every non-spy seat specifically gets a valid location role.
                room.roleBySeat.forEach((role, index) => {
                    const seat = index + 1;
                    if (seat === room.spySeat) return;
                    expect(roleSet.has(role)).toBe(true);
                });

                // Role cycling: assignments follow `roles[i % roles.length]`, so any
                // two seats congruent modulo the role-list length share a role...
                const len = location!.roles.length;
                for (let a = 0; a < count; a++) {
                    for (let b = a + 1; b < count; b++) {
                        if (a % len === b % len) {
                            expect(room.roleBySeat[a]).toBe(room.roleBySeat[b]);
                        }
                    }
                }
                // ...and the number of distinct roles dealt is exactly how many of
                // the cycle we consumed: min(count, roles.length).
                expect(new Set(room.roleBySeat).size).toBe(Math.min(count, len));

                spySeatsSeen.add(room.spySeat);
                locationsSeen.add(room.location);
            }

            // Over 200 runs the shuffle must move the spy around and vary the venue.
            expect(spySeatsSeen.size).toBeGreaterThan(1);
            expect(locationsSeen.size).toBeGreaterThan(1);
        });
    }
});
