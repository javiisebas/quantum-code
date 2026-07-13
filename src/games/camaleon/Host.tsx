'use client';

import { PerPlayerHost } from '../_shared/PerPlayerHost';
import { buildCamaleon, projectCamaleon } from './domain';
import { camaleonManifest } from './manifest';
import { CamaleonCard } from './CamaleonCard';

/**
 * El Camaleón host (shared screen): configure players, show the join code + QR — and, with
 * «Yo también juego», this device becomes the host's own secret card.
 */
export function CamaleonHost() {
    return (
        <PerPlayerHost
            game={camaleonManifest.id}
            build={buildCamaleon}
            project={projectCamaleon}
            card={(view, actions) => <CamaleonCard view={view} actions={actions} />}
        />
    );
}
