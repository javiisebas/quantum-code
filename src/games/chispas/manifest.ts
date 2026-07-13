import { validateLivePayload } from '../_shared/live/live-session';
import type { GameManifest } from '../types';

export const CHISPAS_ID = 'chispas';

export const chispasManifest: GameManifest = {
    id: CHISPAS_ID,
    name: 'Chispas',
    tagline: 'Responde con lo más gracioso que se te ocurra y votad al ganador. Risas aseguradas.',
    emoji: '⚡',
    accent: 'yellow',
    minPlayers: 3,
    maxPlayers: 10,
    players: '3–10',
    duration: '15 min',
    secrecy: 'per-player',
    howTo: [
        'Cada ronda, la pantalla principal muestra un reto para todos.',
        'Escribe en tu móvil la respuesta más graciosa que se te ocurra.',
        'Cuando estén todas, votad la mejor desde el móvil: la tuya no cuenta.',
        'Cada voto que recibas te suma 100 puntos.',
        'Tras tres rondas, gana quien más risas haya arrancado.',
    ],
};

/**
 * Live games keep no secret in the room payload (all state lives in the live-store), so the
 * payload is the shared minimal `{ kind: 'live' }` marker.
 */
export const validateChispasPayload = validateLivePayload;
