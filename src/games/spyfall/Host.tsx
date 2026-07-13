'use client';

import { PerPlayerHost } from '../_shared/PerPlayerHost';
import { buildSpyfall } from './domain';
import { spyfallManifest } from './manifest';

/** Spyfall host (shared screen): configure players, show the join code + QR. */
export function SpyfallHost() {
    return <PerPlayerHost game={spyfallManifest.id} build={buildSpyfall} />;
}
