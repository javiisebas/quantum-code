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
};

/**
 * Live games keep no secret in the room payload (all state lives in the live-store), so the
 * payload is the shared minimal `{ kind: 'live' }` marker.
 */
export const validateChispasPayload = validateLivePayload;
