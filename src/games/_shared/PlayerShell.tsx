'use client';

import { usePlayerRoom } from '@/platform/room/use-player-room';
import { useHeartbeat } from '@/platform/room/use-presence';
import { ErrorBoundary } from '@/platform/ui/ErrorBoundary';
import { JoinScreen } from '@/platform/ui/JoinScreen';
import { Loading } from '@/platform/ui/Loading';
import { ReactNode } from 'react';

/**
 * Shared player ("phone") shell for per-player-secret games. Handles the three states every such
 * game's phone view goes through — loading, no/unknown code, and ready — and hands the game its
 * payload plus this phone's claimed seat. Games only render their own secret card via `children`.
 *
 * The "no room here" state is the platform's `<JoinScreen>`, not a per-game form: a code now
 * resolves to its own game, so there is exactly one way in and one place that explains a code
 * that didn't work. Arriving with a code that resolves to nothing says so, instead of showing a
 * blank form that looks like it's your fault.
 */
interface PlayerShellProps<T> {
    game: string;
    code: number | null;
    children: (payload: T, seat: number) => ReactNode;
}

export function PlayerShell<T>({ game, code, children }: PlayerShellProps<T>) {
    const { status, payload, seat } = usePlayerRoom<T>({ game, code, withSeat: true });
    // Announce presence so the host lobby counts this phone live (no-op when code null).
    useHeartbeat({ game, code });

    if (status === 'loading') {
        return <Loading label="Entrando en la partida…" />;
    }

    if (status === 'ready' && payload && seat !== null) {
        return <ErrorBoundary>{children(payload, seat)}</ErrorBoundary>;
    }

    // A code that led nowhere is an explanation the player can act on; no code at all is just
    // the empty form.
    return <JoinScreen initialError={code === null ? null : 'unknown'} />;
}
