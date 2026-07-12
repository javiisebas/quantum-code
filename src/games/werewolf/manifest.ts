import type { GameManifest } from '../types';
import { WEREWOLF_ROLES } from './domain';

export const WEREWOLF_ID = 'werewolf';

export const werewolfManifest: GameManifest = {
    id: WEREWOLF_ID,
    name: 'Hombres Lobo',
    tagline: 'La aldea duerme y los lobos salen a cazar. Desenmascáralos antes de que ganen.',
    emoji: '🐺',
    accent: 'amber',
    minPlayers: 4,
    maxPlayers: 16,
    players: '4–16',
    duration: '20 min',
    secrecy: 'per-player',
};

const MAX_SEATS = 24;

/** Validate a Hombres Lobo payload: `{ roleBySeat[] }` of known role keys. */
export const validateWerewolfPayload = (payload: unknown): boolean => {
    if (typeof payload !== 'object' || payload === null) return false;
    const { roleBySeat } = payload as { roleBySeat?: unknown };
    return (
        Array.isArray(roleBySeat) &&
        roleBySeat.length >= 1 &&
        roleBySeat.length <= MAX_SEATS &&
        roleBySeat.every(
            (r) => typeof r === 'string' && Object.prototype.hasOwnProperty.call(WEREWOLF_ROLES, r),
        )
    );
};
