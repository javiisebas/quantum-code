'use client';

import { PlayerShell } from '../_shared/PlayerShell';
import type { SpyfallRoom } from './domain';
import { spyfallManifest } from './manifest';
import { SpyfallCard } from './SpyfallCard';

/** Spyfall player (phone): claim a seat and reveal this player's secret card. */
export function SpyfallPlayer({ code }: { code: number | null }) {
    return (
        <PlayerShell<SpyfallRoom> game={spyfallManifest.id} gameName={spyfallManifest.name} code={code}>
            {(payload, seat) => <SpyfallCard payload={payload} seat={seat} />}
        </PlayerShell>
    );
}
