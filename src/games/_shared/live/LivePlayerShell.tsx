'use client';

import { LocalStorageHelper } from '@/platform/persistence/local-storage';
import { usePlayerRoom } from '@/platform/room/use-player-room';
import { submitInput } from '@/platform/room/live-client';
import { useHeartbeat } from '@/platform/room/use-presence';
import { Button } from '@/platform/ui/Button';
import { ErrorBoundary } from '@/platform/ui/ErrorBoundary';
import { Surface } from '@/platform/ui/Surface';
import { Spinner } from '@heroui/react';
import { FormEvent, ReactNode, useEffect, useState } from 'react';
import { JoinForm } from '../JoinForm';
import { LiveRoomPayload, ROSTER_ROUND } from './live-session';

/**
 * Shared phone shell for LIVE games. Handles everything before the game itself: validate
 * the code, claim a stable seat, ask the player's name once, and register that name in the
 * room roster (input round 0) so the host lobby lists them. Then it hands the game its
 * `{ code, seat, name }` and the game renders the live phases via `useLiveState`.
 *
 * The name is remembered across games/rooms (a player types it once), and re-registered on
 * every mount so a reconnecting phone reappears in the roster.
 */
const NAME_KEY = 'quantum:player-name';
const MAX_NAME = 16;

interface LivePlayerShellProps {
    game: string;
    gameName: string;
    code: number | null;
    children: (session: {
        code: number;
        seat: number;
        name: string;
        seatToken: string;
    }) => ReactNode;
}

export function LivePlayerShell({ game, gameName, code, children }: LivePlayerShellProps) {
    const { status, seat, seatToken } = usePlayerRoom<LiveRoomPayload>({
        game,
        code,
        withSeat: true,
    });
    useHeartbeat({ game, code });

    const [name, setName] = useState('');
    const [nameLoaded, setNameLoaded] = useState(false);

    // Load the remembered name once on mount (client-only).
    useEffect(() => {
        const stored = LocalStorageHelper.getLocalStorageItem<string>(NAME_KEY);
        if (stored) setName(stored);
        setNameLoaded(true);
    }, []);

    // Register (or refresh) this seat's name in the roster whenever we have all four.
    useEffect(() => {
        if (code === null || seat === null || !seatToken || name.length === 0) return;
        void submitInput(game, code, ROSTER_ROUND, seat, { name }, seatToken).catch(() => {});
    }, [game, code, seat, seatToken, name]);

    if (code === null) {
        return <JoinForm game={game} gameName={gameName} />;
    }

    if (status === 'loading' || !nameLoaded) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Spinner color="secondary" label="Entrando en la partida…" />
            </div>
        );
    }

    // Unknown/expired code (or no seat token yet) → let the player re-enter one.
    if (status === 'empty' || seat === null || seatToken === null) {
        return <JoinForm game={game} gameName={gameName} />;
    }

    if (name.length === 0) {
        return <NameForm gameName={gameName} onSubmit={setName} />;
    }

    return <ErrorBoundary>{children({ code, seat, name, seatToken })}</ErrorBoundary>;
}

/** One-time name entry. Persists the name globally so the player only types it once. */
function NameForm({ gameName, onSubmit }: { gameName: string; onSubmit: (name: string) => void }) {
    const [draft, setDraft] = useState('');
    const trimmed = draft.trim().slice(0, MAX_NAME);

    const submit = (event: FormEvent) => {
        event.preventDefault();
        if (trimmed.length === 0) return;
        LocalStorageHelper.setLocalStorageItem(NAME_KEY, trimmed);
        onSubmit(trimmed);
    };

    return (
        <main className="flex min-h-screen items-center justify-center px-6 py-12">
            <Surface as="section" className="w-full max-w-sm p-8 text-center">
                <h1 className="text-2xl font-bold text-white">{gameName}</h1>
                <p className="mt-2 text-sm text-gray-400">¿Cómo te llamas?</p>
                <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
                    <input
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        maxLength={MAX_NAME}
                        autoFocus
                        placeholder="Tu nombre"
                        aria-label="Tu nombre"
                        className="w-full rounded-xl bg-white/5 px-4 py-3 text-center text-lg font-semibold text-white ring-1 ring-inset ring-white/15 outline-none transition placeholder:text-gray-500 focus:ring-2 focus:ring-purple-500"
                    />
                    <Button type="submit" variant="primary" fullWidth isDisabled={trimmed.length === 0}>
                        Entrar
                    </Button>
                </form>
            </Surface>
        </main>
    );
}
