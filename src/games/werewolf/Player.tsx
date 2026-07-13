'use client';

import { PlayerShell } from '../_shared/PlayerShell';
import type { WerewolfSeatView } from './domain';
import { werewolfManifest } from './manifest';
import { WerewolfCard } from './WerewolfCard';

/** Hombres Lobo player (phone): claim a seat and reveal this player's secret role. */
export function WerewolfPlayer({ code }: { code: number | null }) {
    return (
        <PlayerShell<WerewolfSeatView> game={werewolfManifest.id} gameName={werewolfManifest.name} code={code}>
            {(view) => <WerewolfCard view={view} />}
        </PlayerShell>
    );
}
