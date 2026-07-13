'use client';

import { usePlayerRoom } from '@/platform/room/use-player-room';
import { useHeartbeat } from '@/platform/room/use-presence';
import { ErrorBoundary } from '@/platform/ui/ErrorBoundary';
import { Spinner } from '@heroui/react';
import { ReactNode } from 'react';
import { JoinForm } from './JoinForm';

/**
 * Shared player ("phone") shell for per-player-secret games. Handles the three states
 * every such game's phone view goes through — loading, no/unknown code (join form),
 * and ready — and hands the game its shared payload plus this phone's claimed seat.
 * Games only render their own secret card via `children`.
 */
interface PlayerShellProps<T> {
    game: string;
    gameName: string;
    code: number | null;
    children: (payload: T, seat: number) => ReactNode;
}

export function PlayerShell<T>({ game, gameName, code, children }: PlayerShellProps<T>) {
    const { status, payload, seat } = usePlayerRoom<T>({ game, code, withSeat: true });
    // Announce presence so the host lobby counts this phone live (no-op when code null).
    useHeartbeat({ game, code });

    if (status === 'loading') {
        return (
            <div className="flex h-screen items-center justify-center">
                <Spinner color="secondary" label="Entrando en la partida…" />
            </div>
        );
    }

    if (status === 'ready' && payload && seat !== null) {
        return <ErrorBoundary>{children(payload, seat)}</ErrorBoundary>;
    }

    return <JoinForm game={game} gameName={gameName} />;
}
