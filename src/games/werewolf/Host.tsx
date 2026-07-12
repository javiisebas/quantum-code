'use client';

import { PerPlayerHost } from '../_shared/PerPlayerHost';
import { buildWerewolf } from './domain';
import { werewolfManifest } from './manifest';

/** Hombres Lobo host (shared screen): configure players, show the join code + QR. */
export function WerewolfHost() {
    return (
        <PerPlayerHost
            game={werewolfManifest.id}
            gameName={werewolfManifest.name}
            emoji={werewolfManifest.emoji}
            accent={werewolfManifest.accent}
            minPlayers={werewolfManifest.minPlayers}
            maxPlayers={werewolfManifest.maxPlayers}
            build={buildWerewolf}
            hint="El anfitrión narra la noche en voz alta."
        />
    );
}
