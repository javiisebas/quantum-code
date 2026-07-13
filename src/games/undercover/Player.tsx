'use client';

import { PlayerShell } from '../_shared/PlayerShell';
import type { UndercoverSeatView } from './domain';
import { undercoverManifest } from './manifest';
import { UndercoverCard } from './UndercoverCard';

/** Undercover player (phone): claim a seat and reveal this player's secret word. */
export function UndercoverPlayer({ code }: { code: number | null }) {
    return (
        <PlayerShell<UndercoverSeatView> game={undercoverManifest.id} code={code}>
            {(view) => <UndercoverCard view={view} />}
        </PlayerShell>
    );
}
