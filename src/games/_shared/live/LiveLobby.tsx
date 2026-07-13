'use client';

import { getManifest } from '@/games/registry';
import { LocalStorageHelper } from '@/platform/persistence/local-storage';
import { openRoom, resumeRoom } from '@/platform/room/room-client';
import { useLiveInputs } from '@/platform/room/use-live-room';
import { Button } from '@/platform/ui/Button';
import { HostLobby } from '@/platform/ui/HostLobby';
import { LobbyPanel } from '@/platform/ui/LobbyPanel';
import { Loading } from '@/platform/ui/Loading';
import { RoomError } from '@/platform/ui/RoomError';
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BiPlay } from 'react-icons/bi';
import { accentOf } from '../accents';
import {
    LIVE_ROOM_PAYLOAD,
    LivePlayer,
    ROSTER_ROUND,
    RosterEntry,
    rosterFromInputs,
} from './live-session';

/**
 * Shared host lobby for LIVE, phase-based games (La Bomba, Chispas, Sintonía). It owns the part
 * every live game shares — open the room, show the way in, and gather the roster of named
 * players in real time — then hands control to the game once the host presses "Empezar":
 *
 *   creating → lobby (shared <HostLobby>) → started (renders `children`)
 *
 * All the chrome — layout, QR + code, how-to-play, home — now comes from the platform's
 * `<HostLobby>`, which the per-player games use too, so every game in the arcade waits in a
 * lobby that looks and behaves identically. What is left here is only what is genuinely
 * live-specific: the roster channel and the start gate.
 *
 * The code is minted by the SERVER (`openRoom`) and persisted with the host token, so a host
 * reload resumes the same lobby (`resumeRoom`).
 */
interface LiveLobbyProps {
    game: string;
    minPlayers: number;
    maxPlayers: number;
    /** Rendered once the host starts, with the room code, host token and roster snapshot. */
    children: (session: { code: number; players: LivePlayer[]; hostToken: string }) => ReactNode;
}

type Phase = 'creating' | 'lobby' | 'started' | 'error';

const storageKey = (game: string) => `quantum:live-host:${game}`;

export function LiveLobby({ game, minPlayers, maxPlayers, children }: LiveLobbyProps) {
    const manifest = getManifest(game);
    const acc = accentOf(manifest?.accent ?? 'purple');
    const [phase, setPhase] = useState<Phase>('creating');
    const [code, setCode] = useState<number | null>(null);
    const [hostToken, setHostToken] = useState<string | null>(null);
    const [startedPlayers, setStartedPlayers] = useState<LivePlayer[]>([]);

    // The roster poll must not start until the host token is KNOWN-GOOD. On a fresh room that is
    // immediate; on a resume it is only true once `resumeRoom` has settled and we've adopted any
    // re-minted token. Polling before then would 401 with the stale token and trip the
    // `onUnauthorized` backstop — which would open a DIFFERENT fresh room and orphan the code the
    // host is already showing. This gate is what keeps the resume path and that backstop from
    // racing each other.
    const [pollReady, setPollReady] = useState(false);

    const startNewRoom = useCallback(async () => {
        setPhase('creating');
        setPollReady(false);
        try {
            // The SERVER allocates the code: only it can see every game's reservations, and a
            // code now has to name exactly one room across the whole arcade.
            const { code: fresh, hostToken: token } = await openRoom(game, LIVE_ROOM_PAYLOAD);
            // Persist the host capability with the code so a reload resumes as the host.
            LocalStorageHelper.setLocalStorageItem(storageKey(game), {
                code: fresh,
                hostToken: token,
            });
            setCode(fresh);
            setHostToken(token);
            setPhase('lobby');
            // Freshly minted token — safe to poll at once.
            setPollReady(true);
        } catch {
            setPhase('error');
        }
    }, [game]);

    // Resume a persisted lobby on mount, else open a fresh room. Guard StrictMode's
    // double-invoke so we never burn two codes.
    const bootedRef = useRef(false);
    useEffect(() => {
        if (bootedRef.current) return;
        bootedRef.current = true;
        const persisted = LocalStorageHelper.getLocalStorageItem<{
            code: number;
            hostToken?: string;
        }>(storageKey(game));
        // Resume only with a stored host token (a pre-token entry can't act as host → fresh room).
        if (persisted?.code && persisted.hostToken) {
            // Show the code/QR immediately (a reloading host wants to see it at once), but hold the
            // roster poll until the token is confirmed — see `pollReady`.
            setCode(persisted.code);
            setHostToken(persisted.hostToken);
            setPhase('lobby');
            // Re-ensure the room AND its code reservation — either may have lapsed past its TTL.
            resumeRoom(game, persisted.code, LIVE_ROOM_PAYLOAD)
                .then(({ hostToken: minted }) => {
                    // A token comes back ONLY when this call actually re-created the room, i.e.
                    // the old one had expired. The server minted a fresh host capability with it,
                    // so the token we persisted is now worthless: adopt the new one, or every
                    // roster poll would 401 and the lobby would never fill.
                    if (minted) {
                        setHostToken(minted);
                        LocalStorageHelper.setLocalStorageItem(storageKey(game), {
                            code: persisted.code,
                            hostToken: minted,
                        });
                    }
                })
                // Whether the room survived (kept our token) or was re-created (adopted the new
                // one), the token in state is now the right one, so it is safe to start polling.
                // Even on a network failure we release the gate: the `onUnauthorized` backstop then
                // covers a genuinely-dead token, which is the only case left it can fire for.
                .finally(() => setPollReady(true));
        } else {
            void startNewRoom();
        }
    }, [game, startNewRoom]);

    // Live roster: phones register `{ name }` under their seat as they join.
    const rosterInputs = useLiveInputs<RosterEntry>({
        game,
        code,
        round: ROSTER_ROUND,
        active: phase === 'lobby' && pollReady,
        hostToken,
        // Backstop only: with `pollReady` gating the start, the token is known-good by the time we
        // poll, so this can fire only if a capability dies UNDER us mid-lobby. Nobody has joined
        // yet, so opening a fresh room is the right recovery — better than a roster that can never
        // fill.
        onUnauthorized: () => void startNewRoom(),
    });
    const players = useMemo(() => rosterFromInputs(rosterInputs), [rosterInputs]);

    const start = useCallback(() => {
        setStartedPlayers(players);
        setPhase('started');
    }, [players]);

    if (phase === 'error' || !manifest) {
        return (
            <RoomError message="No se pudo crear la sala." onRetry={() => void startNewRoom()} />
        );
    }

    if (phase === 'started' && code !== null && hostToken !== null) {
        return <>{children({ code, players: startedPlayers, hostToken })}</>;
    }

    if (phase === 'creating' || code === null) {
        return <Loading label="Creando la sala…" />;
    }

    // Lobby. The minimum-players requirement lives IN the button rather than in a caption under
    // it: a disabled control should say what it is waiting for, instead of making the host read
    // a separate line to find out why it's grey.
    const missing = minPlayers - players.length;
    const ready = missing <= 0;

    return (
        <HostLobby manifest={manifest} code={code}>
            <LobbyPanel
                names={players.map((player) => player.name)}
                min={minPlayers}
                max={maxPlayers}
                accentChip={acc.chip}
                action={
                    <Button
                        variant="accent"
                        accentClass={acc.solidButton}
                        fullWidth
                        startContent={ready ? <BiPlay size={22} /> : undefined}
                        onPress={start}
                        isDisabled={!ready}
                    >
                        {ready
                            ? 'Empezar partida'
                            : `Faltan ${missing} ${missing === 1 ? 'jugador' : 'jugadores'}`}
                    </Button>
                }
            />
        </HostLobby>
    );
}
