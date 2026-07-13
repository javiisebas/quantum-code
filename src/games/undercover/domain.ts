/**
 * Undercover ("Impostor de palabras") domain.
 *
 * Every player but a few is told the SAME civilian word; the remaining players are the
 * undercovers, who receive a different but similar word instead. Nobody is told whether
 * they are an undercover — everyone just gets a word. Each round, players describe their
 * word with a single word and try to unmask the impostors. Each phone reads its own
 * seat's word from the shared payload.
 */

/** A pair of similar-but-different words: what the civilians get vs. what the impostors get. */
export interface WordPair {
    civilian: string;
    undercover: string;
}

/** A published Undercover room: one word per seat, and which seats are undercovers. */
export interface UndercoverRoom {
    /** wordBySeat[i] is the word for seat i+1. */
    wordBySeat: string[];
    /** 1-based seats that received the undercover word (sorted ascending). */
    undercoverSeats: number[];
}

/** Word pool (Spanish). Each pair is close enough to make bluffing fun. */
export const WORD_PAIRS: WordPair[] = [
    { civilian: 'Gato', undercover: 'Tigre' },
    { civilian: 'Café', undercover: 'Té' },
    { civilian: 'Playa', undercover: 'Piscina' },
    { civilian: 'Guitarra', undercover: 'Violín' },
    { civilian: 'Pizza', undercover: 'Empanada' },
    { civilian: 'Coche', undercover: 'Moto' },
    { civilian: 'Manzana', undercover: 'Pera' },
    { civilian: 'Perro', undercover: 'Lobo' },
    { civilian: 'Sol', undercover: 'Luna' },
    { civilian: 'Río', undercover: 'Lago' },
    { civilian: 'Cerveza', undercover: 'Vino' },
    { civilian: 'Tren', undercover: 'Metro' },
    { civilian: 'Libro', undercover: 'Revista' },
    { civilian: 'Zapato', undercover: 'Bota' },
    { civilian: 'Nieve', undercover: 'Lluvia' },
    { civilian: 'Silla', undercover: 'Sofá' },
    { civilian: 'Naranja', undercover: 'Mandarina' },
    { civilian: 'Reloj', undercover: 'Pulsera' },
    { civilian: 'Montaña', undercover: 'Colina' },
    { civilian: 'Helado', undercover: 'Batido' },
    { civilian: 'Abeja', undercover: 'Avispa' },
    { civilian: 'Camión', undercover: 'Furgoneta' },
    { civilian: 'Cuchillo', undercover: 'Tijeras' },
    { civilian: 'Piano', undercover: 'Órgano' },
    { civilian: 'Fresa', undercover: 'Frambuesa' },
    { civilian: 'Toalla', undercover: 'Manta' },
    { civilian: 'Barco', undercover: 'Balsa' },
    { civilian: 'Cocodrilo', undercover: 'Caimán' },
    { civilian: 'Sombrero', undercover: 'Gorra' },
    { civilian: 'Galleta', undercover: 'Bizcocho' },
    { civilian: 'Rana', undercover: 'Sapo' },
    { civilian: 'Almohada', undercover: 'Cojín' },
    { civilian: 'Tortuga', undercover: 'Caracol' },
    { civilian: 'Limón', undercover: 'Lima' },
    { civilian: 'Bicicleta', undercover: 'Patinete' },
];

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
 * Build a fresh Undercover room for `count` players: pick a word pair, give the civilian
 * word to every seat, then choose the undercovers (1 for fewer than 7 players, else 2)
 * as distinct random seats and overwrite their word with the undercover word.
 */
export const buildUndercover = (count: number): UndercoverRoom => {
    const pair = WORD_PAIRS[randomInt(WORD_PAIRS.length)];
    const wordBySeat = Array.from({ length: count }, () => pair.civilian);

    const undercoverCount = count < 7 ? 1 : 2;
    const seats = shuffle(Array.from({ length: count }, (_, i) => i + 1)); // 1-based
    const undercoverSeats = seats.slice(0, undercoverCount).sort((a, b) => a - b);

    for (const seat of undercoverSeats) {
        wordBySeat[seat - 1] = pair.undercover;
    }

    return { wordBySeat, undercoverSeats };
};

/**
 * The single-seat slice an Undercover phone is allowed to receive: only this seat's word
 * (or the "table full" marker for a seat beyond the dealt count). It deliberately carries
 * NO `undercoverSeats`, so no phone can tell who the impostors are.
 */
export type UndercoverSeatView =
    | { kind: 'word'; seat: number; word: string }
    | { kind: 'full'; seat: number };

/**
 * Project an Undercover room down to what `seat` (1-based) may see. Pure and server-side:
 * only that seat's word crosses the wire — the list of undercover seats never leaves the
 * server.
 */
export const projectUndercover = (payload: UndercoverRoom, seat: number): UndercoverSeatView => {
    if (seat > payload.wordBySeat.length) return { kind: 'full', seat };
    return { kind: 'word', seat, word: payload.wordBySeat[seat - 1] };
};
