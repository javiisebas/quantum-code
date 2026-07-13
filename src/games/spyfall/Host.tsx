'use client';

import { PerPlayerHost } from '../_shared/PerPlayerHost';
import { buildSpyfall, projectSpyfall } from './domain';
import { spyfallManifest } from './manifest';
import { SpyfallCard } from './SpyfallCard';

/**
 * Spyfall host (shared screen): configure players, show the join code + QR — and, with
 * «Yo también juego», this device becomes the host's own secret card.
 */
export function SpyfallHost() {
    return (
        <PerPlayerHost
            game={spyfallManifest.id}
            build={buildSpyfall}
            project={projectSpyfall}
            card={(view, actions) => <SpyfallCard view={view} actions={actions} />}
        />
    );
}
