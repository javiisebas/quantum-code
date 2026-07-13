/**
 * La Bomba ("pasa la bomba a contrarreloj") domain — a hot-potato game on the live channel.
 * The TV shows a category (e.g. "cosas que llevas a la playa"); a hidden bomb fuse (random
 * duration, NEVER shown) ticks down on the HOST only. Players say an answer OUT LOUD in seat
 * order and tap "¡Pasar!" to hand the bomb on; whoever holds it when it blows takes a strike.
 * After a fixed number of rounds, the fewest strikes wins.
 *
 * This module is the pure, testable core: fuse bounds, category picking, holder rotation,
 * strike bookkeeping and the phase transitions. All wall-clock time (the fuse deadline) and
 * IO live in the host component; the RNG helpers here are deliberately BOUNDED so their
 * invariants stay testable (a fuse is always within [MIN, MAX], a holder is always a seat).
 */

import type { LivePlayer } from '../_shared/live/live-session';
import { BOMBA_CATEGORIES } from './categories';

export type BombaPhase = 'playing' | 'explosion' | 'final';

/**
 * Hidden fuse bounds (ms). A round arms a random duration in [MIN, MAX]: long enough that the
 * bomb is passed around a few times, short enough that nobody can pace it — and the exact value
 * is NEVER published, so suspense depends on nobody knowing when it blows.
 */
export const MIN_FUSE_MS = 12_000;
export const MAX_FUSE_MS = 40_000;

/** A strike-tally line for the scoreboard. */
export interface BombaScore {
    seat: number;
    name: string;
    strikes: number;
}

/**
 * The public game snapshot the host publishes and phones poll. It carries ONLY what each phase
 * may reveal: during 'playing' just the category, the current holder and the pass counter — the
 * fuse deadline is host-only and never appears here, so the countdown stays secret. Strike
 * standings surface only on 'explosion' + 'final' (like the other live games' `scores`).
 */
export interface BombaState {
    phase: BombaPhase;
    /** Per-game generation (bumped by "Jugar otra vez"); namespaces the pass input buckets. */
    gen: number;
    round: number;
    totalRounds: number;
    /** The frozen roster (seat + name), so phones can resolve `holderSeat`/`lastExploded` → name. */
    players: LivePlayer[];
    /** The current round's category prompt (public for the whole round). */
    category: string;
    /** Seat currently holding the bomb (public during 'playing' + 'explosion'). */
    holderSeat: number;
    /**
     * Monotonic pass counter for the current round. The holder tags their "¡Pasar!" with this
     * value so the host advances exactly once per tap; a re-polled/duplicate tap can't double-
     * advance (its token no longer matches the counter). Also lets phones bucket their input.
     */
    pass: number;
    /** 'explosion': the seat that was holding the bomb when it blew. */
    lastExploded?: number;
    /** 'explosion' + 'final': strike standings, fewest first. */
    scores?: BombaScore[];
}

/**
 * Host-authoritative game state. The full state lives on the host; only the public projection
 * above is published. The fuse deadline is NOT here — the host keeps it in a ref (off React
 * state) so it can never leak into a published snapshot.
 */
export interface BombaGame {
    round: number;
    phase: BombaPhase;
    totalRounds: number;
    /** Frozen roster seats, ascending — the pass order the bomb travels. */
    seats: number[];
    /** The current round's category. */
    category: string;
    /** Categories consumed so far this game (incl. the current), so rounds never repeat one. */
    usedCategories: string[];
    /** Seat currently holding the bomb. */
    holderSeat: number;
    /** Monotonic pass counter for the current round (resets to 0 each round). */
    pass: number;
    /** Per-seat strike tally. */
    strikes: Record<number, number>;
    /** The seat that exploded this round (during 'explosion'), else null. */
    lastExploded: number | null;
}

// ---------------------------------------------------------------------------
// Input bucket ids (see live-store `round`). Roster is 0; passes use a positive bucket keyed
// by round, namespaced by the per-game generation so "Jugar otra vez" (which reuses the SAME
// room and repeats round numbers 1..N) never reads the previous game's passes. `gen % 9` keeps
// `gen*1000 + …` under the input route's round ceiling (10_000).
// ---------------------------------------------------------------------------

/** Input bucket where the holder writes `{ token }` (the pass counter it is responding to). */
export const passRound = (gen: number, round: number): number => (gen % 9) * 1000 + 100 + round;

// ---------------------------------------------------------------------------
// Bounded RNG helpers (kept at the edge of the pure core; each has a testable invariant).
// ---------------------------------------------------------------------------

/** A random hidden fuse duration in ms, always within [MIN_FUSE_MS, MAX_FUSE_MS] inclusive. */
export const randomFuse = (): number =>
    MIN_FUSE_MS + Math.floor(Math.random() * (MAX_FUSE_MS - MIN_FUSE_MS + 1));

/** A random seat from the roster (the round's starting holder). */
export const randomSeat = (seats: number[]): number =>
    seats[Math.floor(Math.random() * seats.length)];

/**
 * Pick a random category not yet used this game. Avoids repeats until the deck is exhausted,
 * then falls back to the full list (never happens in practice — 132 categories ≫ max rounds).
 */
export const pickCategory = (used: string[]): string => {
    const remaining = BOMBA_CATEGORIES.filter((category) => !used.includes(category));
    const pool = remaining.length > 0 ? remaining : BOMBA_CATEGORIES;
    return pool[Math.floor(Math.random() * pool.length)];
};

// ---------------------------------------------------------------------------
// Pure transitions
// ---------------------------------------------------------------------------

/**
 * The seat after `currentSeat` in the started roster, wrapping around. `seats` is the frozen,
 * ascending seat list; a `currentSeat` not in it (shouldn't happen) falls back to the first
 * seat so the return is always a real seat.
 */
export const nextHolder = (currentSeat: number, seats: number[]): number => {
    const index = seats.indexOf(currentSeat);
    if (index === -1) return seats[0];
    return seats[(index + 1) % seats.length];
};

/** Add one strike to the given holder's tally; every other seat is untouched. */
export const applyExplosion = (
    strikes: Record<number, number>,
    holderSeat: number,
): Record<number, number> => ({ ...strikes, [holderSeat]: (strikes[holderSeat] ?? 0) + 1 });

/** Hand the bomb to the next seat and bump the pass counter (one call = one advance). */
export const passBomb = (game: BombaGame): BombaGame => ({
    ...game,
    holderSeat: nextHolder(game.holderSeat, game.seats),
    pass: game.pass + 1,
});

/** Blow the bomb: charge the current holder a strike and enter the 'explosion' phase. */
export const explode = (game: BombaGame): BombaGame => ({
    ...game,
    phase: 'explosion',
    strikes: applyExplosion(game.strikes, game.holderSeat),
    lastExploded: game.holderSeat,
});

/**
 * Start the next round with a fresh category, a fresh random starting holder and a reset pass
 * counter — or, after the last round, enter 'final'. The new round's fuse is armed by the host
 * (wall-clock), not here.
 */
export const nextRound = (game: BombaGame): BombaGame => {
    if (game.round >= game.totalRounds) return { ...game, phase: 'final' };
    const category = pickCategory(game.usedCategories);
    return {
        ...game,
        round: game.round + 1,
        phase: 'playing',
        category,
        usedCategories: [...game.usedCategories, category],
        holderSeat: randomSeat(game.seats),
        pass: 0,
        lastExploded: null,
    };
};

/** Fresh game: round 1, a first category, a random starting holder, empty strikes. */
export const initGame = (totalRounds: number, seats: number[]): BombaGame => {
    const category = pickCategory([]);
    return {
        round: 1,
        phase: 'playing',
        totalRounds,
        seats,
        category,
        usedCategories: [category],
        holderSeat: randomSeat(seats),
        pass: 0,
        strikes: {},
        lastExploded: null,
    };
};

/** Strike standings for the roster, FEWEST strikes first, ties broken by seat ascending. */
export const scoreboard = (
    players: LivePlayer[],
    strikes: Record<number, number>,
): BombaScore[] =>
    players
        .map((player) => ({
            seat: player.seat,
            name: player.name,
            strikes: strikes[player.seat] ?? 0,
        }))
        .sort((a, b) => a.strikes - b.strikes || a.seat - b.seat);
