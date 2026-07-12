import type { GameManifest } from '../types';
import { BOARD_SIZE, NoTeamEnum, TeamEnum } from './domain';

/** Stable id — also the Redis namespace and the `/host/codenames` URL segment. */
export const CODENAMES_ID = 'codenames';

export const codenamesManifest: GameManifest = {
    id: CODENAMES_ID,
    name: 'Código Secreto',
    tagline: 'Encuentra las palabras de tu equipo antes que el rival — y nunca toques al asesino.',
    emoji: '🔤',
    accent: 'purple',
    minPlayers: 4,
    maxPlayers: 12,
    players: '4+',
    duration: '15 min',
    secrecy: 'shared',
};

// --- Payload validation for the generic room API (`/api/room/codenames`) ---

const VALID_ROLES = new Set<string>([...Object.values(TeamEnum), ...Object.values(NoTeamEnum)]);
const MAX_WORD_LENGTH = 40;

/** Exactly BOARD_SIZE entries, each a known RoleEnum value. */
const isValidRoles = (value: unknown): boolean =>
    Array.isArray(value) &&
    value.length === BOARD_SIZE &&
    value.every((role) => typeof role === 'string' && VALID_ROLES.has(role));

/** Exactly BOARD_SIZE non-empty, length-bounded strings. */
const isValidWords = (value: unknown): boolean =>
    Array.isArray(value) &&
    value.length === BOARD_SIZE &&
    value.every((w) => typeof w === 'string' && w.length > 0 && w.length <= MAX_WORD_LENGTH);

/**
 * Validate an untrusted Codenames room payload (`{ roles, words }`) before it is
 * written to the store — this blocks arbitrary/oversized junk from reaching Redis.
 */
export const validateCodenamesPayload = (payload: unknown): boolean => {
    if (typeof payload !== 'object' || payload === null) {
        return false;
    }
    const { roles, words } = payload as { roles?: unknown; words?: unknown };
    return isValidRoles(roles) && isValidWords(words);
};
