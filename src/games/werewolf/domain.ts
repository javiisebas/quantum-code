/**
 * Hombres Lobo ("Werewolf") domain.
 *
 * Every player is dealt a hidden ROLE: most are simple aldeanos, a few are lobos who
 * secretly hunt the village each night, and the rest are special villagers (vidente,
 * bruja, cazador, cupido) with a one-off power. A human host narrates the night/day
 * out loud; each phone only ever reads its own seat's role from the shared payload.
 */

/** The role dealt to a seat. */
export type WerewolfRole = 'aldeano' | 'lobo' | 'vidente' | 'bruja' | 'cazador' | 'cupido';

/** Display + team metadata for a role, shown on that player's secret card. */
export interface WerewolfRoleInfo {
    label: string;
    emoji: string;
    description: string;
    team: 'aldea' | 'lobos';
}

/** Every role's Spanish label, glyph, one-line ability and team allegiance. */
export const WEREWOLF_ROLES: Record<WerewolfRole, WerewolfRoleInfo> = {
    aldeano: {
        label: 'Aldeano',
        emoji: '👤',
        description: 'No tienes poderes: debate y vota de día para desenmascarar a los lobos.',
        team: 'aldea',
    },
    lobo: {
        label: 'Lobo',
        emoji: '🐺',
        description: 'Cada noche, junto al resto de lobos, eliges en secreto a una víctima.',
        team: 'lobos',
    },
    vidente: {
        label: 'Vidente',
        emoji: '🔮',
        description: 'Cada noche descubres el rol verdadero de un jugador a tu elección.',
        team: 'aldea',
    },
    bruja: {
        label: 'Bruja',
        emoji: '🧪',
        description: 'Tienes una poción para salvar a la víctima y otra para envenenar, una vez cada una.',
        team: 'aldea',
    },
    cazador: {
        label: 'Cazador',
        emoji: '🏹',
        description: 'Si mueres, te llevas contigo a otro jugador de un último disparo.',
        team: 'aldea',
    },
    cupido: {
        label: 'Cupido',
        emoji: '💘',
        description: 'La primera noche enamoras a dos jugadores: si uno muere, el otro muere de pena.',
        team: 'aldea',
    },
};

/** A published Hombres Lobo room: one hidden role per seat. */
export interface WerewolfRoom {
    /** roleBySeat[i] is the role for seat i+1. */
    roleBySeat: WerewolfRole[];
}

const shuffle = <T>(items: T[]): T[] => {
    const copy = items.slice();
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
};

/**
 * Build a fresh Hombres Lobo room for `count` players. The distribution scales with
 * the table size: one lobo per four players (at least one), always a vidente, then a
 * bruja (≥6), a cazador (≥8) and a cupido (≥10). Every remaining seat is an aldeano.
 *
 * Special roles are laid out in descending priority (lobos first, cupido last) and
 * truncated to `count`, so a tiny table can never be dealt more specials than seats
 * and always keeps at least one lobo. The finished role list is Fisher–Yates shuffled.
 */
export const buildWerewolf = (count: number): WerewolfRoom => {
    const lobos = Math.max(1, Math.floor(count / 4));

    const specials: WerewolfRole[] = Array.from({ length: lobos }, () => 'lobo' as const);
    specials.push('vidente');
    if (count >= 6) specials.push('bruja');
    if (count >= 8) specials.push('cazador');
    if (count >= 10) specials.push('cupido');

    // Defensive: never deal more special roles than there are seats (lobos come first,
    // so this only ever drops the lowest-priority extras and keeps ≥1 lobo).
    const dealt = specials.slice(0, count);
    while (dealt.length < count) dealt.push('aldeano');

    return { roleBySeat: shuffle(dealt) };
};

/**
 * The single-seat slice a Hombres Lobo phone is allowed to receive: only this seat's role
 * key (or the "table full" marker for a seat beyond the dealt count). The card looks up
 * WEREWOLF_ROLES for the label/description — no other seat's role is ever present.
 */
export type WerewolfSeatView =
    | { kind: 'role'; seat: number; role: WerewolfRole }
    | { kind: 'full'; seat: number };

/**
 * Project a Hombres Lobo room down to what `seat` (1-based) may see. Pure and server-side:
 * only that seat's role key crosses the wire — every other seat's role stays on the server.
 */
export const projectWerewolf = (payload: WerewolfRoom, seat: number): WerewolfSeatView => {
    if (seat > payload.roleBySeat.length) return { kind: 'full', seat };
    return { kind: 'role', seat, role: payload.roleBySeat[seat - 1] };
};
