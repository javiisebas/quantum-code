import { describe, it, expect } from 'vitest';

import {
    generateRoles,
    generateWords,
    generateCode,
    createRevealedState,
    parseCode,
    getTeamProgress,
    getWinner,
    BOARD_SIZE,
    ROLE_COUNTS,
} from '@/domain';
import { TeamEnum } from '@/enum/team.enum';
import { NoTeamEnum } from '@/enum/no-team.enum';
import type { RoleEnum } from '@/enum/role.enum';

/**
 * All valid role values, used to assert that generated roles are well-formed
 * and to count occurrences per role.
 */
const ALL_ROLES: RoleEnum[] = [
    TeamEnum.BLUE,
    TeamEnum.RED,
    NoTeamEnum.NEUTRAL,
    NoTeamEnum.BLACK,
];

/**
 * Count how many times each role value appears in a board.
 */
function countRoles(roles: RoleEnum[]): Record<RoleEnum, number> {
    const counts: Record<RoleEnum, number> = {
        [TeamEnum.BLUE]: 0,
        [TeamEnum.RED]: 0,
        [NoTeamEnum.NEUTRAL]: 0,
        [NoTeamEnum.BLACK]: 0,
    };
    for (const role of roles) {
        counts[role] += 1;
    }
    return counts;
}

/**
 * Deterministic 25-card board used by getTeamProgress / getWinner tests.
 * Layout (indices):
 *   0..5   -> blue    (6 cards)
 *   6..12  -> red     (7 cards)
 *   13..23 -> neutral (11 cards)
 *   24     -> black   (1 card)
 * This matches ROLE_COUNTS exactly.
 */
function makeFixedBoard(): RoleEnum[] {
    const board: RoleEnum[] = [];
    for (let i = 0; i < ROLE_COUNTS.blue; i++) board.push(TeamEnum.BLUE);
    for (let i = 0; i < ROLE_COUNTS.red; i++) board.push(TeamEnum.RED);
    for (let i = 0; i < ROLE_COUNTS.neutral; i++) board.push(NoTeamEnum.NEUTRAL);
    for (let i = 0; i < ROLE_COUNTS.black; i++) board.push(NoTeamEnum.BLACK);
    return board;
}

/** Blue card indices in the fixed board. */
const BLUE_INDICES = [0, 1, 2, 3, 4, 5];
/** Red card indices in the fixed board. */
const RED_INDICES = [6, 7, 8, 9, 10, 11, 12];

/**
 * Build a 25-length revealed mask that is `false` everywhere except the given
 * indices, which are set to `true`.
 */
function revealMask(...indices: number[]): boolean[] {
    const mask = Array<boolean>(BOARD_SIZE).fill(false);
    for (const i of indices) mask[i] = true;
    return mask;
}

describe('board constants', () => {
    it('BOARD_SIZE is 25', () => {
        expect(BOARD_SIZE).toBe(25);
    });

    it('ROLE_COUNTS matches the frozen spec and sums to BOARD_SIZE', () => {
        expect(ROLE_COUNTS).toEqual({ neutral: 11, blue: 6, red: 7, black: 1 });
        const sum =
            ROLE_COUNTS.neutral +
            ROLE_COUNTS.blue +
            ROLE_COUNTS.red +
            ROLE_COUNTS.black;
        expect(sum).toBe(BOARD_SIZE);
    });

    // Sanity check that the deterministic fixture is internally consistent.
    it('fixed board fixture matches ROLE_COUNTS', () => {
        const counts = countRoles(makeFixedBoard());
        expect(counts[TeamEnum.BLUE]).toBe(ROLE_COUNTS.blue);
        expect(counts[TeamEnum.RED]).toBe(ROLE_COUNTS.red);
        expect(counts[NoTeamEnum.NEUTRAL]).toBe(ROLE_COUNTS.neutral);
        expect(counts[NoTeamEnum.BLACK]).toBe(ROLE_COUNTS.black);
    });
});

describe('generateRoles', () => {
    it('returns exactly BOARD_SIZE roles with the exact ROLE_COUNTS distribution (robust over many runs)', () => {
        for (let run = 0; run < 50; run++) {
            const roles = generateRoles();
            expect(roles).toHaveLength(BOARD_SIZE);

            const counts = countRoles(roles);
            expect(counts[TeamEnum.BLUE]).toBe(ROLE_COUNTS.blue);
            expect(counts[TeamEnum.RED]).toBe(ROLE_COUNTS.red);
            expect(counts[NoTeamEnum.NEUTRAL]).toBe(ROLE_COUNTS.neutral);
            expect(counts[NoTeamEnum.BLACK]).toBe(ROLE_COUNTS.black);

            // Every element must be a valid role value.
            for (const role of roles) {
                expect(ALL_ROLES).toContain(role);
            }
        }
    });

    it('returns a fresh array reference on each call, and mutating one does not affect another', () => {
        const a = generateRoles();
        const b = generateRoles();
        expect(a).not.toBe(b);

        const originalLength = a.length;
        a.push(TeamEnum.BLUE);
        expect(a).toHaveLength(originalLength + 1);
        // b is untouched by the mutation of a.
        expect(b).toHaveLength(BOARD_SIZE);
    });
});

describe('generateWords', () => {
    it('returns 25 unique, non-empty string words (robust over several runs)', () => {
        for (let run = 0; run < 20; run++) {
            const words = generateWords();
            expect(words).toHaveLength(25);

            // All entries are non-empty strings.
            for (const word of words) {
                expect(typeof word).toBe('string');
                expect(word.length).toBeGreaterThan(0);
            }

            // All entries are unique.
            expect(new Set(words).size).toBe(words.length);
        }
    });
});

describe('generateCode', () => {
    it('always returns an integer within [100000, 999999] (over 1000 runs)', () => {
        for (let run = 0; run < 1000; run++) {
            const code = generateCode();
            expect(Number.isInteger(code)).toBe(true);
            expect(code).toBeGreaterThanOrEqual(100000);
            expect(code).toBeLessThanOrEqual(999999);
        }
    });
});

describe('createRevealedState', () => {
    it('returns 25 elements, all strictly false', () => {
        const revealed = createRevealedState();
        expect(revealed).toHaveLength(25);
        for (const value of revealed) {
            expect(value).toBe(false);
        }
        // Also assert the whole array shape at once.
        expect(revealed).toEqual(Array<boolean>(25).fill(false));
    });

    it('returns a fresh array reference on each call', () => {
        expect(createRevealedState()).not.toBe(createRevealedState());
    });
});

describe('parseCode', () => {
    const cases: Array<{ input: string | null; expected: number | null }> = [
        { input: '123456', expected: 123456 },
        { input: '100000', expected: 100000 },
        { input: '999999', expected: 999999 },
        { input: '99999', expected: null }, // too short
        { input: '1000000', expected: null }, // too long / out of range
        { input: '000000', expected: null }, // below range
        { input: 'abc', expected: null },
        { input: '', expected: null },
        { input: null, expected: null },
        { input: '12345a', expected: null }, // trailing non-digit
        { input: ' 123456 ', expected: null }, // parseCode does not trim -> invalid
    ];

    it.each(cases)('parseCode($input) -> $expected', ({ input, expected }) => {
        expect(parseCode(input)).toBe(expected);
    });
});

describe('getTeamProgress', () => {
    it('reports partial progress for both teams with totals from ROLE_COUNTS', () => {
        const roles = makeFixedBoard();
        // Reveal 3 of 6 blue and 2 of 7 red.
        const revealed = revealMask(
            BLUE_INDICES[0],
            BLUE_INDICES[1],
            BLUE_INDICES[2],
            RED_INDICES[0],
            RED_INDICES[1],
        );

        const progress = getTeamProgress(roles, revealed);
        expect(progress.blue).toEqual({ found: 3, total: ROLE_COUNTS.blue });
        expect(progress.red).toEqual({ found: 2, total: ROLE_COUNTS.red });
    });

    it('reports a fully-revealed team while the other is partial', () => {
        const roles = makeFixedBoard();
        // Reveal ALL blue and 1 red.
        const revealed = revealMask(...BLUE_INDICES, RED_INDICES[0]);

        const progress = getTeamProgress(roles, revealed);
        expect(progress.blue).toEqual({
            found: ROLE_COUNTS.blue,
            total: ROLE_COUNTS.blue,
        });
        expect(progress.red).toEqual({ found: 1, total: ROLE_COUNTS.red });
    });

    it('totals are constant (equal to ROLE_COUNTS) even when nothing is revealed', () => {
        const roles = makeFixedBoard();
        const revealed = Array<boolean>(BOARD_SIZE).fill(false);

        const progress = getTeamProgress(roles, revealed);
        expect(progress.blue).toEqual({ found: 0, total: ROLE_COUNTS.blue });
        expect(progress.red).toEqual({ found: 0, total: ROLE_COUNTS.red });
    });
});

describe('getWinner', () => {
    it('returns BLUE when all blue cards are revealed', () => {
        const roles = makeFixedBoard();
        const revealed = revealMask(...BLUE_INDICES);
        expect(getWinner(roles, revealed)).toBe(TeamEnum.BLUE);
    });

    it('returns RED when all red cards are revealed', () => {
        const roles = makeFixedBoard();
        const revealed = revealMask(...RED_INDICES);
        expect(getWinner(roles, revealed)).toBe(TeamEnum.RED);
    });

    it('returns null when neither team is fully revealed', () => {
        const roles = makeFixedBoard();
        // Some blue and some red, but neither complete.
        const revealed = revealMask(
            BLUE_INDICES[0],
            BLUE_INDICES[1],
            RED_INDICES[0],
            RED_INDICES[1],
        );
        expect(getWinner(roles, revealed)).toBeNull();
    });

    it('returns null when nothing is revealed', () => {
        const roles = makeFixedBoard();
        const revealed = Array<boolean>(BOARD_SIZE).fill(false);
        expect(getWinner(roles, revealed)).toBeNull();
    });
});
