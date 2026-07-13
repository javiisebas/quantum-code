'use client';

import { PerPlayerHost } from '../_shared/PerPlayerHost';
import { buildCamaleon } from './domain';
import { camaleonManifest } from './manifest';

/** El Camaleón host (shared screen): configure players, show the join code + QR. */
export function CamaleonHost() {
    return <PerPlayerHost game={camaleonManifest.id} build={buildCamaleon} />;
}
