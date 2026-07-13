/**
 * El Camaleón domain.
 *
 * A 4×4 board of 16 related words (a topic) is shown on every phone. All players but
 * one share the same SECRET WORD — a single highlighted cell of the board — and each
 * says one word related to it to prove they belong. The remaining player is the
 * Chameleon, who is told only that they are the Chameleon: they must bluff, blend in,
 * and deduce the secret word from what everyone else says. Every phone reads the shared
 * board plus its own seat's assignment from this payload.
 */

import { CHAMELEON_TOPICS } from './topics';

/** A published Camaleón room: the board, the secret cell, and the Chameleon's seat. */
export interface CamaleonRoom {
    /** Theme label of the chosen topic, shown above the board. */
    theme: string;
    /** Exactly 16 words, shuffled for display in the 4×4 grid. */
    grid: string[];
    /** 0-based index into `grid` — the secret word's cell (known to all but the Chameleon). */
    secretIndex: number;
    /** 1-based seat that is the Chameleon. */
    chameleonSeat: number;
}

/**
 * What a single phone at `seat` is allowed to see of a Camaleón room. The theme and
 * board are PUBLIC (shown to everyone); the SECRET is `secretIndex`. The Chameleon's
 * view OMITS `secretIndex` entirely, so their phone can never leak which cell is the
 * secret word — they must deduce it. Neither view carries `chameleonSeat`: no phone
 * ever needs to know who the Chameleon is.
 */
export type CamaleonSeatView =
    | { kind: 'chameleon'; seat: number; theme: string; grid: string[] }
    | { kind: 'player'; seat: number; theme: string; grid: string[]; secretIndex: number };

const shuffle = <T>(items: T[]): T[] => {
    const copy = items.slice();
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
};

const randomInt = (maxExclusive: number): number => Math.floor(Math.random() * maxExclusive);

/**
 * Build a fresh Camaleón room for `count` players: pick a random topic, shuffle its 16
 * words into the display grid, choose the secret cell (a random 0..15 index) and pick
 * one seat (1-based) to be the Chameleon.
 */
export const buildCamaleon = (count: number): CamaleonRoom => {
    const topic = CHAMELEON_TOPICS[randomInt(CHAMELEON_TOPICS.length)];
    const grid = shuffle(topic.words);
    const secretIndex = randomInt(16);
    const chameleonSeat = randomInt(count) + 1; // 1-based
    return { theme: topic.theme, grid, secretIndex, chameleonSeat };
};

/**
 * Project a full room down to only what `seat` may see, so a phone never receives more
 * than its seat is entitled to. The Chameleon's seat gets the theme + board with NO
 * `secretIndex`; every other seat additionally gets `secretIndex` (the secret cell).
 * Unlike the role games there is no "seat beyond count" case: the board is shared, so a
 * late joiner is simply a non-Chameleon player who sees the secret — today's behaviour.
 */
export const projectCamaleon = (payload: CamaleonRoom, seat: number): CamaleonSeatView => {
    const { theme, grid } = payload;
    if (seat === payload.chameleonSeat) {
        return { kind: 'chameleon', seat, theme, grid };
    }
    return { kind: 'player', seat, theme, grid, secretIndex: payload.secretIndex };
};
