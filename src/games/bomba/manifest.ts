import { validateLivePayload } from '../_shared/live/live-session';
import type { GameManifest } from '../types';

export const BOMBA_ID = 'bomba';

export const bombaManifest: GameManifest = {
    id: BOMBA_ID,
    name: 'La Bomba',
    tagline: 'Di algo de la categoría y pásala rápido. El que la tenga al explotar, pierde.',
    emoji: '💣',
    accent: 'orange',
    minPlayers: 3,
    maxPlayers: 12,
    players: '3–12',
    duration: '10 min',
    secrecy: 'per-player',
    howTo: [
        'La pantalla principal muestra una categoría y quién tiene la bomba.',
        'Cuando te toque, di en alto algo de la categoría y pulsa «¡Pasar!» en tu móvil.',
        'La mecha es secreta: nadie sabe cuándo va a explotar.',
        'A quien le explote la bomba se lleva un bombazo.',
        'Tras varias rondas, gana quien menos bombazos acumule.',
    ],
};

/**
 * Live game: the room payload is the shared minimal `{ kind: 'live' }` marker (all real state,
 * incl. the hidden fuse, lives on the host / in the live-store).
 */
export const validateBombaPayload = validateLivePayload;
