import type { GameManifest } from '../types';

export const SPYFALL_ID = 'spyfall';

export const spyfallManifest: GameManifest = {
    id: SPYFALL_ID,
    name: '¿Dónde está el espía?',
    tagline:
        'Todos conocen el lugar… menos el espía. Descúbrelo antes de que adivine dónde estáis.',
    emoji: '🕵️‍♂️',
    accent: 'rose',
    minPlayers: 3,
    maxPlayers: 12,
    players: '3–12',
    duration: '10 min',
    secrecy: 'per-player',
    howTo: [
        'Tu móvil te dice el lugar donde estáis y tu rol allí… salvo si eres el espía.',
        'Por turnos, haceos preguntas sobre el lugar sin llegar a nombrarlo.',
        'Responde para demostrar que sabes dónde estás, sin ponérselo fácil al espía.',
        'Cuando sospechéis, acusad: si desenmascaráis al espía, ganáis.',
        'El espía gana si aguanta sin que le pillen o si adivina el lugar.',
    ],
};

const MAX_SEATS = 20;

/** Validate a Spyfall payload: `{ location, roleBySeat[], spySeat }`. */
export const validateSpyfallPayload = (payload: unknown): boolean => {
    if (typeof payload !== 'object' || payload === null) return false;
    const { location, roleBySeat, spySeat } = payload as {
        location?: unknown;
        roleBySeat?: unknown;
        spySeat?: unknown;
    };
    if (typeof location !== 'string' || location.length === 0 || location.length > 60) return false;
    if (
        !Array.isArray(roleBySeat) ||
        roleBySeat.length < 1 ||
        roleBySeat.length > MAX_SEATS ||
        !roleBySeat.every((r) => typeof r === 'string' && r.length > 0 && r.length <= 60)
    ) {
        return false;
    }
    return (
        typeof spySeat === 'number' &&
        Number.isInteger(spySeat) &&
        spySeat >= 1 &&
        spySeat <= roleBySeat.length
    );
};
