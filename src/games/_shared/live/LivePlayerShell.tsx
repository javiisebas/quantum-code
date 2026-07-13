'use client';

import { getManifest } from '@/games/registry';
import type { GameManifest } from '@/games/types';
import { LocalStorageHelper } from '@/platform/persistence/local-storage';
import { submitInput } from '@/platform/room/live-client';
import { usePlayerRoom } from '@/platform/room/use-player-room';
import { useHeartbeat } from '@/platform/room/use-presence';
import { Button } from '@/platform/ui/Button';
import { ErrorBoundary } from '@/platform/ui/ErrorBoundary';
import { HowToPlayButton } from '@/platform/ui/HowToPlay';
import { JoinScreen } from '@/platform/ui/JoinScreen';
import { Loading } from '@/platform/ui/Loading';
import { Screen, ScreenBody } from '@/platform/ui/Screen';
import { Surface } from '@/platform/ui/Surface';
import { TextInput } from '@/platform/ui/TextInput';
import { TopBar } from '@/platform/ui/TopBar';
import { FormEvent, ReactNode, useEffect, useState } from 'react';
import { LiveRoomPayload, ROSTER_ROUND } from './live-session';
import { LiveManifestProvider } from './PhoneStage';

/**
 * Shared phone shell for LIVE games. Handles everything before the game itself: validate the
 * code, claim a stable seat, ask the player's name once, and register that name in the room
 * roster (input round 0) so the host lobby lists them. Then it hands the game its
 * `{ code, seat, name }` and the game renders the live phases via `useLiveState`.
 *
 * The name is remembered across games/rooms (a player types it once), and re-registered on every
 * mount so a reconnecting phone reappears in the roster.
 *
 * A missing or dead code lands on the platform's `<JoinScreen>` — the same one screen every
 * other way in ends at — rather than a per-game form.
 */
const NAME_KEY = 'quantum:player-name';
const MAX_NAME = 16;

interface LivePlayerShellProps {
    game: string;
    code: number | null;
    children: (session: {
        code: number;
        seat: number;
        name: string;
        seatToken: string;
    }) => ReactNode;
}

export function LivePlayerShell({ game, code, children }: LivePlayerShellProps) {
    const manifest = getManifest(game);
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
        return <JoinScreen />;
    }

    if (status === 'loading' || !nameLoaded) {
        return <Loading label="Entrando en la partida…" />;
    }

    // Unknown/expired code (or no seat yet) → back to the one join screen, told why.
    if (status === 'empty' || seat === null || seatToken === null || !manifest) {
        return <JoinScreen initialError="unknown" />;
    }

    if (name.length === 0) {
        return <NameForm manifest={manifest} onSubmit={setName} />;
    }

    // Every `<PhoneStage>` a live game renders — in any phase, in any of the three games — reads
    // the manifest from here, so the phone's top bar is identical to the host's and to the four
    // secret-card games'.
    return (
        <LiveManifestProvider manifest={manifest}>
            <ErrorBoundary>{children({ code, seat, name, seatToken })}</ErrorBoundary>
        </LiveManifestProvider>
    );
}

/** One-time name entry. Persists the name globally so the player only types it once, ever. */
function NameForm({
    manifest,
    onSubmit,
}: {
    manifest: GameManifest;
    onSubmit: (name: string) => void;
}) {
    const [draft, setDraft] = useState('');
    const trimmed = draft.trim().slice(0, MAX_NAME);

    const submit = (event: FormEvent) => {
        event.preventDefault();
        if (trimmed.length === 0) return;
        LocalStorageHelper.setLocalStorageItem(NAME_KEY, trimmed);
        onSubmit(trimmed);
    };

    return (
        // The one page rail so the chrome spans it; the card is what's capped, at the arcade's one
        // `card` width. The rules button is here for the same reason it is on every other game
        // screen: this is the first thing a player sees of a game they may never have played.
        <Screen>
            <TopBar
                emoji={manifest.emoji}
                title={manifest.name}
                right={<HowToPlayButton manifest={manifest} />}
            />
            <ScreenBody>
                <Surface as="section" className="flex w-full flex-col gap-6 p-6 text-center sm:p-8">
                    <div className="flex flex-col gap-2">
                        <h2 className="text-2xl font-bold text-white">¿Cómo te llamas?</h2>
                        <p className="text-sm text-gray-400">
                            Es el nombre que verá el resto en la pantalla.
                        </p>
                    </div>
                    <form onSubmit={submit} className="flex flex-col gap-3">
                        <TextInput
                            value={draft}
                            onChange={(event) => setDraft(event.target.value)}
                            maxLength={MAX_NAME}
                            autoFocus
                            placeholder="Tu nombre"
                            aria-label="Tu nombre"
                        />
                        <Button
                            type="submit"
                            variant="primary"
                            fullWidth
                            isDisabled={trimmed.length === 0}
                        >
                            Entrar
                        </Button>
                    </form>
                </Surface>
            </ScreenBody>
        </Screen>
    );
}
