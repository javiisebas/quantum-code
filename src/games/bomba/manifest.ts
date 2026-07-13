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
};

/**
 * Live game: the room payload is the shared minimal `{ kind: 'live' }` marker (all real state,
 * incl. the hidden fuse, lives on the host / in the live-store).
 */
export const validateBombaPayload = validateLivePayload;
