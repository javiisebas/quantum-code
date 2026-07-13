'use client';

import { PlayerShell } from '../_shared/PlayerShell';
import { CamaleonCard } from './CamaleonCard';
import type { CamaleonSeatView } from './domain';
import { camaleonManifest } from './manifest';

/** El Camaleón player (phone): claim a seat and reveal this player's secret card. */
export function CamaleonPlayer({ code }: { code: number | null }) {
    return (
        <PlayerShell<CamaleonSeatView>
            game={camaleonManifest.id}
            gameName={camaleonManifest.name}
            code={code}
        >
            {(view) => <CamaleonCard view={view} />}
        </PlayerShell>
    );
}
