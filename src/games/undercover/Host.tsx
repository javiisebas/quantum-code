'use client';

import { PerPlayerHost } from '../_shared/PerPlayerHost';
import { buildUndercover } from './domain';
import { undercoverManifest } from './manifest';

/** Undercover host (shared screen): configure players, show the join code + QR. */
export function UndercoverHost() {
    return (
        <PerPlayerHost
            game={undercoverManifest.id}
            gameName={undercoverManifest.name}
            emoji={undercoverManifest.emoji}
            minPlayers={undercoverManifest.minPlayers}
            maxPlayers={undercoverManifest.maxPlayers}
            build={buildUndercover}
            hint="Casi todos tenéis la misma palabra; el impostor tiene una parecida."
        />
    );
}
