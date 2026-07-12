import { CODENAMES_ID, codenamesManifest, validateCodenamesPayload } from './codenames/manifest';
import type { GameServerModule } from './types';

/**
 * Server-side game registry: maps a game id to its Redis namespace and payload
 * validator. Used by the generic room API (`/api/room/[game]`) so one route serves
 * every game while still validating each game's payload with its own rules.
 *
 * Imported only by server route handlers — never pulled into a client bundle.
 */
const serverGames: Record<string, GameServerModule> = {
    [CODENAMES_ID]: {
        manifest: codenamesManifest,
        namespace: CODENAMES_ID,
        validatePayload: validateCodenamesPayload,
    },
};

/** Resolve a game's server module by id, or null when the game is unknown. */
export const getServerGame = (id: string): GameServerModule | null => serverGames[id] ?? null;
