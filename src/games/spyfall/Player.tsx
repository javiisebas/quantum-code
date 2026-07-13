'use client';

import { PlayerShell } from '../_shared/PlayerShell';
import type { SpyfallSeatView } from './domain';
import { spyfallManifest } from './manifest';
import { SpyfallCard } from './SpyfallCard';

/** Spyfall player (phone): claim a seat and reveal this player's secret card. */
export function SpyfallPlayer({ code }: { code: number | null }) {
    return (
        <PlayerShell<SpyfallSeatView> game={spyfallManifest.id} code={code}>
            {(view) => <SpyfallCard view={view} />}
        </PlayerShell>
    );
}
