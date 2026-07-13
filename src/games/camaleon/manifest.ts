import type { GameManifest } from '../types';

export const CAMALEON_ID = 'camaleon';

export const camaleonManifest: GameManifest = {
    id: CAMALEON_ID,
    name: 'El Camaleón',
    tagline: 'Todos conocen la palabra… menos el camaleón. Desenmascáralo antes de que se camufle.',
    emoji: '🦎',
    accent: 'lime',
    minPlayers: 3,
    maxPlayers: 12,
    players: '3–12',
    duration: '8 min',
    secrecy: 'per-player',
};

const MAX_SEATS = 20;

/** Validate a Camaleón payload: `{ theme, grid[16], secretIndex, chameleonSeat }`. */
export const validateCamaleonPayload = (payload: unknown): boolean => {
    if (typeof payload !== 'object' || payload === null) return false;
    const { theme, grid, secretIndex, chameleonSeat } = payload as {
        theme?: unknown;
        grid?: unknown;
        secretIndex?: unknown;
        chameleonSeat?: unknown;
    };
    if (typeof theme !== 'string' || theme.length === 0 || theme.length > 60) return false;
    if (
        !Array.isArray(grid) ||
        grid.length !== 16 ||
        !grid.every((w) => typeof w === 'string' && w.length > 0 && w.length <= 40)
    ) {
        return false;
    }
    if (
        typeof secretIndex !== 'number' ||
        !Number.isInteger(secretIndex) ||
        secretIndex < 0 ||
        secretIndex > 15
    ) {
        return false;
    }
    return (
        typeof chameleonSeat === 'number' &&
        Number.isInteger(chameleonSeat) &&
        chameleonSeat >= 1 &&
        chameleonSeat <= MAX_SEATS
    );
};
