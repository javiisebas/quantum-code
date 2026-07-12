import { NoTeamEnum } from '@/enum/no-team.enum';
import { RoleEnum } from '@/enum/role.enum';
import { TeamEnum } from '@/enum/team.enum';
import { BOARD_SIZE, ROLE_COUNTS } from './rules';
import { words_ddbb } from './words';

/**
 * Fisher-Yates in-place shuffle. Mutates and returns the given array. Callers must
 * pass a fresh (owned) array so concurrent requests never share a reference.
 */
const shuffleInPlace = <T>(items: T[]): T[] => {
    for (let i = items.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
};

/**
 * Build a fresh, shuffled board of 25 roles following ROLE_COUNTS
 * (11 neutral, 6 blue, 7 red, 1 black). A new array is allocated on every call so
 * concurrent server requests can never share/mutate the same reference.
 */
export const generateRoles = (): RoleEnum[] => {
    const roles: RoleEnum[] = [
        ...Array<RoleEnum>(ROLE_COUNTS.neutral).fill(NoTeamEnum.NEUTRAL),
        ...Array<RoleEnum>(ROLE_COUNTS.blue).fill(TeamEnum.BLUE),
        ...Array<RoleEnum>(ROLE_COUNTS.red).fill(TeamEnum.RED),
        ...Array<RoleEnum>(ROLE_COUNTS.black).fill(NoTeamEnum.BLACK),
    ];

    return shuffleInPlace(roles);
};

/** Pick BOARD_SIZE (25) unique random words for a board. */
export const generateWords = (): string[] => {
    return shuffleInPlace([...words_ddbb]).slice(0, BOARD_SIZE);
};

/** Initial "revealed" state: 25 cards, all hidden (false). */
export const createRevealedState = (): boolean[] => {
    return new Array(BOARD_SIZE).fill(false);
};

/**
 * A full board is the pairing of roles and words by index: card `i` shows
 * `words[i]` and belongs to `roles[i]`. Both are published together so the play
 * device and the spies see exactly the same board for a code.
 */
export interface Board {
    roles: RoleEnum[];
    words: string[];
}

/** Generate a fresh, self-consistent board (roles + words). */
export const generateBoard = (): Board => ({
    roles: generateRoles(),
    words: generateWords(),
});
