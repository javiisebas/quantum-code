import { bombaManifest } from './bomba/manifest';
import { camaleonManifest } from './camaleon/manifest';
import { chispasManifest } from './chispas/manifest';
import { codenamesManifest } from './codenames/manifest';
import { sintoniaManifest } from './sintonia/manifest';
import { spyfallManifest } from './spyfall/manifest';
import { undercoverManifest } from './undercover/manifest';
import { werewolfManifest } from './werewolf/manifest';
import type { GameManifest } from './types';

/**
 * The arcade catalogue: pure game metadata, safe to import anywhere (server
 * components, client components, API routes). Adding a game = import its manifest
 * and add it to this list; the landing grid and routing pick it up automatically.
 *
 * Runtime wiring lives elsewhere so this stays dependency-free:
 *  - React screens → `game-loaders.tsx` (lazy Host/Player components).
 *  - Store + validation → `registry.server.ts` (namespaces + payload validators).
 */
export const gameManifests: GameManifest[] = [
    codenamesManifest,
    chispasManifest,
    camaleonManifest,
    sintoniaManifest,
    bombaManifest,
    spyfallManifest,
    undercoverManifest,
    werewolfManifest,
];

/** Look up a game's manifest by id, or null when unknown. */
export const getManifest = (id: string): GameManifest | null =>
    gameManifests.find((manifest) => manifest.id === id) ?? null;
