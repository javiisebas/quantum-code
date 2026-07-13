'use client';

import { PerPlayerHost } from '../_shared/PerPlayerHost';
import { buildCamaleon } from './domain';
import { camaleonManifest } from './manifest';

/** El Camaleón host (shared screen): configure players, show the join code + QR. */
export function CamaleonHost() {
    return (
        <PerPlayerHost
            game={camaleonManifest.id}
            gameName={camaleonManifest.name}
            emoji={camaleonManifest.emoji}
            accent={camaleonManifest.accent}
            minPlayers={camaleonManifest.minPlayers}
            maxPlayers={camaleonManifest.maxPlayers}
            build={buildCamaleon}
            hint="Uno de vosotros será el camaleón y no conocerá la palabra secreta."
        />
    );
}
