import { describe, it, expect } from 'vitest';
import { buildWerewolf, WEREWOLF_ROLES, type WerewolfRole } from './domain';

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
