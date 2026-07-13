'use client';

import { PerPlayerHost } from '../_shared/PerPlayerHost';
import { buildWerewolf, projectWerewolf } from './domain';
import { werewolfManifest } from './manifest';
import { WerewolfCard } from './WerewolfCard';

/**
 * Hombres Lobo host (shared screen): configure players, show the join code + QR — and, with
 * «Yo también juego», this device becomes the host's own secret card.
 */
export function WerewolfHost() {
    return (
        <PerPlayerHost
            game={werewolfManifest.id}
            build={buildWerewolf}
            project={projectWerewolf}
            card={(view, actions) => <WerewolfCard view={view} actions={actions} />}
        />
    );
}
