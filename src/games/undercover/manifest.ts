import type { GameManifest } from '../types';

export const UNDERCOVER_ID = 'undercover';

export const undercoverManifest: GameManifest = {
    id: UNDERCOVER_ID,
    name: 'Impostor',
    tagline:
        'Casi todos comparten una palabra secreta… los impostores reciben una parecida. Descúbrelos.',
    emoji: '🎭',
    accent: 'emerald',
    minPlayers: 3,
    maxPlayers: 12,
    players: '3–12',
    duration: '10 min',
    secrecy: 'per-player',
    howTo: [
        'Tu móvil te da una palabra, pero nunca te dice si eres impostor.',
        'Casi todos compartís la misma; los impostores tienen una parecida.',
        'Por turnos, describe tu palabra en alto con UNA sola palabra.',
        'No seas tan obvio que la delates, ni tan vago que parezcas impostor.',
        'Debatid, votad a quién echar y ganaréis si caen los impostores.',
    ],
};

const MAX_SEATS = 20;

/** Validate an Undercover payload: `{ wordBySeat[], undercoverSeats[] }`. */
export const validateUndercoverPayload = (payload: unknown): boolean => {
    if (typeof payload !== 'object' || payload === null) return false;
    const { wordBySeat, undercoverSeats } = payload as {
        wordBySeat?: unknown;
        undercoverSeats?: unknown;
    };
    if (
        !Array.isArray(wordBySeat) ||
        wordBySeat.length < 1 ||
        wordBySeat.length > MAX_SEATS ||
        !wordBySeat.every((w) => typeof w === 'string' && w.length > 0 && w.length <= 60)
    ) {
        return false;
    }
    return (
        Array.isArray(undercoverSeats) &&
        undercoverSeats.length >= 1 &&
        undercoverSeats.length <= wordBySeat.length &&
        undercoverSeats.every(
            (s) => typeof s === 'number' && Number.isInteger(s) && s >= 1 && s <= wordBySeat.length,
        )
    );
};
