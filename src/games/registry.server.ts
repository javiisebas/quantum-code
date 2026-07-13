import { BOMBA_ID, bombaManifest, validateBombaPayload } from './bomba/manifest';
import { projectCamaleon } from './camaleon/domain';
import { CAMALEON_ID, camaleonManifest, validateCamaleonPayload } from './camaleon/manifest';
import { CHISPAS_ID, chispasManifest, validateChispasPayload } from './chispas/manifest';
import { CODENAMES_ID, codenamesManifest, validateCodenamesPayload } from './codenames/manifest';
import { SINTONIA_ID, sintoniaManifest, validateSintoniaPayload } from './sintonia/manifest';
import { projectSpyfall } from './spyfall/domain';
import { SPYFALL_ID, spyfallManifest, validateSpyfallPayload } from './spyfall/manifest';
import { projectUndercover } from './undercover/domain';
import {
    UNDERCOVER_ID,
    undercoverManifest,
    validateUndercoverPayload,
} from './undercover/manifest';
import { projectWerewolf } from './werewolf/domain';
import { WEREWOLF_ID, werewolfManifest, validateWerewolfPayload } from './werewolf/manifest';
import type { GameServerModule } from './types';

/** Cast a game's typed seat projection to the registry's `unknown`-in/out slot. */
type Projector = GameServerModule['projectForSeat'];

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
    [CHISPAS_ID]: {
        manifest: chispasManifest,
        namespace: CHISPAS_ID,
        validatePayload: validateChispasPayload,
    },
    [CAMALEON_ID]: {
        manifest: camaleonManifest,
        namespace: CAMALEON_ID,
        validatePayload: validateCamaleonPayload,
        projectForSeat: projectCamaleon as Projector,
    },
    [SINTONIA_ID]: {
        manifest: sintoniaManifest,
        namespace: SINTONIA_ID,
        validatePayload: validateSintoniaPayload,
    },
    [BOMBA_ID]: {
        manifest: bombaManifest,
        namespace: BOMBA_ID,
        validatePayload: validateBombaPayload,
    },
    [SPYFALL_ID]: {
        manifest: spyfallManifest,
        namespace: SPYFALL_ID,
        validatePayload: validateSpyfallPayload,
        projectForSeat: projectSpyfall as Projector,
    },
    [UNDERCOVER_ID]: {
        manifest: undercoverManifest,
        namespace: UNDERCOVER_ID,
        validatePayload: validateUndercoverPayload,
        projectForSeat: projectUndercover as Projector,
    },
    [WEREWOLF_ID]: {
        manifest: werewolfManifest,
        namespace: WEREWOLF_ID,
        validatePayload: validateWerewolfPayload,
        projectForSeat: projectWerewolf as Projector,
    },
};

/** Resolve a game's server module by id, or null when the game is unknown. */
export const getServerGame = (id: string): GameServerModule | null => serverGames[id] ?? null;
