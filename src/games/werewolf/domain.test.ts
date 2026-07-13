import { describe, it, expect } from 'vitest';
import { buildWerewolf, projectWerewolf, WEREWOLF_ROLES, type WerewolfRole } from './domain';

/** Expected count of a given role for a table of `count` players, per the build rules. */
const expected = (count: number): Record<WerewolfRole, number> => {
    const lobo = Math.max(1, Math.floor(count / 4));
    const vidente = 1;
    const bruja = count >= 6 ? 1 : 0;
    const cazador = count >= 8 ? 1 : 0;
    const cupido = count >= 10 ? 1 : 0;
    const specials = lobo + vidente + bruja + cazador + cupido;
    const aldeano = count - specials;
    return { aldeano, lobo, vidente, bruja, cazador, cupido };
};

describe('buildWerewolf', () => {
    const counts = [4, 6, 8, 10, 16];

    for (const count of counts) {
        it(`deals a valid role distribution for ${count} players across many runs`, () => {
            const want = expected(count);
            // Sanity: the reference distribution itself never exceeds the seat count.
            expect(want.aldeano).toBeGreaterThanOrEqual(0);

            for (let run = 0; run < 200; run++) {
                const room = buildWerewolf(count);

                // One role per seat, every entry a known role key.
                expect(room.roleBySeat).toHaveLength(count);
                for (const role of room.roleBySeat) {
                    expect(Object.prototype.hasOwnProperty.call(WEREWOLF_ROLES, role)).toBe(true);
                }

                // Tally the dealt roles.
                const tally = room.roleBySeat.reduce<Record<string, number>>((acc, role) => {
                    acc[role] = (acc[role] ?? 0) + 1;
                    return acc;
                }, {});
                const countOf = (role: WerewolfRole) => tally[role] ?? 0;

                // At least one lobo, exactly one vidente.
                expect(countOf('lobo')).toBeGreaterThanOrEqual(1);
                expect(countOf('vidente')).toBe(1);

                // Number of lobos follows the scaling rule.
                expect(countOf('lobo')).toBe(Math.max(1, Math.floor(count / 4)));

                // Special (non-aldeano) roles never exceed the number of seats.
                const specials = count - countOf('aldeano');
                expect(specials).toBeLessThanOrEqual(count);

                // The full distribution matches the implemented rules.
                expect(countOf('aldeano')).toBe(want.aldeano);
                expect(countOf('lobo')).toBe(want.lobo);
                expect(countOf('vidente')).toBe(want.vidente);
                expect(countOf('bruja')).toBe(want.bruja);
                expect(countOf('cazador')).toBe(want.cazador);
                expect(countOf('cupido')).toBe(want.cupido);
            }
        });
    }
});

describe('seat projection (sealing)', () => {
    const counts = [3, 4, 5, 6, 7, 8];

    for (const count of counts) {
        it(`seals every seat's view so no other seat's role leaks for ${count} players`, () => {
            for (let run = 0; run < 200; run++) {
                const room = buildWerewolf(count);

                for (let seat = 1; seat <= count; seat++) {
                    const view = projectWerewolf(room, seat);
                    // Cast to a record so the "must NOT be present" checks can probe
                    // fields the discriminated union would refuse to even type.
                    const v = view as Record<string, unknown>;

                    // Each in-range seat gets only its own role key.
                    expect(view.kind).toBe('role');
                    if (view.kind === 'role') {
                        expect(view.role).toBe(room.roleBySeat[seat - 1]);
                        // ...and it is a real key of the role table (nothing invented).
                        expect(
                            Object.prototype.hasOwnProperty.call(WEREWOLF_ROLES, view.role),
                        ).toBe(true);
                    }

                    // THE SEAL: the view carries ONLY this seat's role — no all-seats
                    // role table and no other-seat data of any kind.
                    expect('roleBySeat' in v).toBe(false);
                    expect(Object.keys(v).sort()).toEqual(['kind', 'role', 'seat']);
                }

                // A seat beyond the dealt table is the inert 'full' marker: no role.
                const beyond = projectWerewolf(room, count + 1);
                const b = beyond as Record<string, unknown>;
                expect(beyond.kind).toBe('full');
                expect('role' in b).toBe(false);
                expect('roleBySeat' in b).toBe(false);
            }
        });
    }
});
