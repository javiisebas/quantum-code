'use client';

import { PerPlayerHost } from '../_shared/PerPlayerHost';
import { buildUndercover, projectUndercover } from './domain';
import { undercoverManifest } from './manifest';
import { UndercoverCard } from './UndercoverCard';

/**
 * Undercover host (shared screen): configure players, show the join code + QR — and, with
 * «Yo también juego», this device becomes the host's own secret card.
 */
export function UndercoverHost() {
    return (
        <PerPlayerHost
            game={undercoverManifest.id}
            build={buildUndercover}
            project={projectUndercover}
            card={(view, actions) => <UndercoverCard view={view} actions={actions} />}
        />
    );
}
