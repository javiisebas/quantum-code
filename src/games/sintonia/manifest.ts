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
    howTo: [
        'Cada ronda, un jugador es el psíquico y ve en su móvil la zona objetivo.',
        'Da UNA sola pista en alto para situarla entre los dos extremos del espectro.',
        'El resto debate y mueve el dial de la pantalla hasta donde crea que apunta.',
        'Cuanto más cerca caiga el dial, más puntos se lleva el psíquico (hasta 4).',
        'Todos pasáis por psíquico: gana quien mejores pistas haya dado.',
    ],
};

/** Live game: the room payload is the shared minimal `{ kind: 'live' }` marker. */
export const validateSintoniaPayload = validateLivePayload;
