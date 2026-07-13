import { validateLivePayload } from '../_shared/live/live-session';
import type { GameManifest } from '../types';

export const SINTONIA_ID = 'sintonia';

export const sintoniaManifest: GameManifest = {
    id: SINTONIA_ID,
    name: 'Sintonía',
    tagline: 'Una pista, un dial y un objetivo oculto. ¿Estáis en la misma onda?',
    emoji: '📡',
    accent: 'cyan',
    minPlayers: 3,
    maxPlayers: 10,
    players: '3–10',
    duration: '15 min',
    secrecy: 'per-player',
};

/** Live game: the room payload is the shared minimal `{ kind: 'live' }` marker. */
export const validateSintoniaPayload = validateLivePayload;
