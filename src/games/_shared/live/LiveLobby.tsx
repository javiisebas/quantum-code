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

    const startNewRoom = useCallback(async () => {
        setPhase('creating');
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
            setCode(persisted.code);
            setHostToken(persisted.hostToken);
            setPhase('lobby');
            // Re-ensure the room AND its code reservation — either may have lapsed past its TTL.
            resumeRoom(game, persisted.code, LIVE_ROOM_PAYLOAD)
                .then(({ hostToken: minted }) => {
                    // A token comes back ONLY when this call actually re-created the room, i.e.
                    // the old one had expired. The server minted a fresh host capability with it,
                    // so the token we persisted is now worthless: keeping it locks the host out of
                    // its own room — every roster poll 401s and the lobby never fills, forever.
                    if (!minted) return;
                    setHostToken(minted);
                    LocalStorageHelper.setLocalStorageItem(storageKey(game), {
                        code: persisted.code,
                        hostToken: minted,
                    });
                })
                .catch(() => {});
        } else {
            void startNewRoom();
        }
    }, [game, startNewRoom]);

    // Live roster: phones register `{ name }` under their seat as they join.
    const rosterInputs = useLiveInputs<RosterEntry>({
        game,
        code,
        round: ROSTER_ROUND,
        active: phase === 'lobby',
        hostToken,
        // The room rejected our host capability — the persisted one is dead (its room lapsed and
        // was re-created under a new token). There is nothing to salvage and nobody has joined
        // this lobby yet, so open a fresh room rather than leave the host staring at a roster
        // that can never fill.
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
