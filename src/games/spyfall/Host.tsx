'use client';

import { PerPlayerHost } from '../_shared/PerPlayerHost';
import { buildSpyfall } from './domain';
import { spyfallManifest } from './manifest';

/** Spyfall host (shared screen): configure players, show the join code + QR. */
export function SpyfallHost() {
    return (
        <PerPlayerHost
            game={spyfallManifest.id}
            gameName={spyfallManifest.name}
            emoji={spyfallManifest.emoji}
            accent={spyfallManifest.accent}
            minPlayers={spyfallManifest.minPlayers}
            maxPlayers={spyfallManifest.maxPlayers}
            build={buildSpyfall}
            hint="Uno de vosotros será el espía y no sabrá dónde estáis."
        />
    );
}
