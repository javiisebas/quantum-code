import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';

/**
 * Lazy React screens for each game. Kept apart from the pure `registry.ts` so the
 * arcade landing (which only needs manifests) never bundles every game's component
 * tree — each game's code is code-split behind `next/dynamic` and only loaded when
 * its `/host/<id>` or `/join/<id>` route is visited.
 */
interface GameLoader {
    Host: ComponentType;
    Player: ComponentType<{ code: number | null }>;
}

const gameLoaders: Record<string, GameLoader> = {
    codenames: {
        Host: dynamic(() => import('./codenames/Host').then((m) => m.CodenamesHost)),
        Player: dynamic(() => import('./codenames/Player').then((m) => m.CodenamesPlayer)),
    },
    chispas: {
        Host: dynamic(() => import('./chispas/Host').then((m) => m.ChispasHost)),
        Player: dynamic(() => import('./chispas/Player').then((m) => m.ChispasPlayer)),
    },
    camaleon: {
        Host: dynamic(() => import('./camaleon/Host').then((m) => m.CamaleonHost)),
        Player: dynamic(() => import('./camaleon/Player').then((m) => m.CamaleonPlayer)),
    },
    spyfall: {
        Host: dynamic(() => import('./spyfall/Host').then((m) => m.SpyfallHost)),
        Player: dynamic(() => import('./spyfall/Player').then((m) => m.SpyfallPlayer)),
    },
    undercover: {
        Host: dynamic(() => import('./undercover/Host').then((m) => m.UndercoverHost)),
        Player: dynamic(() => import('./undercover/Player').then((m) => m.UndercoverPlayer)),
    },
    werewolf: {
        Host: dynamic(() => import('./werewolf/Host').then((m) => m.WerewolfHost)),
        Player: dynamic(() => import('./werewolf/Player').then((m) => m.WerewolfPlayer)),
    },
};


/** Resolve a game's lazy Host/Player screens by id, or null when unknown. */
export const getGameLoader = (id: string): GameLoader | null => gameLoaders[id] ?? null;
