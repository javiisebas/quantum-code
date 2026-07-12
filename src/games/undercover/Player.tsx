'use client';

import { PlayerShell } from '../_shared/PlayerShell';
import type { UndercoverRoom } from './domain';
import { undercoverManifest } from './manifest';
import { UndercoverCard } from './UndercoverCard';

/** Undercover player (phone): claim a seat and reveal this player's secret word. */
export function UndercoverPlayer({ code }: { code: number | null }) {
    return (
        <PlayerShell<UndercoverRoom>
            game={undercoverManifest.id}
            gameName={undercoverManifest.name}
            code={code}
        >
            {(payload, seat) => <UndercoverCard payload={payload} seat={seat} />}
        </PlayerShell>
    );
}
