'use client';

import { PerPlayerHost } from '../_shared/PerPlayerHost';
import { buildWerewolf } from './domain';
import { werewolfManifest } from './manifest';

/** Hombres Lobo host (shared screen): configure players, show the join code + QR. */
export function WerewolfHost() {
    return <PerPlayerHost game={werewolfManifest.id} build={buildWerewolf} />;
}
