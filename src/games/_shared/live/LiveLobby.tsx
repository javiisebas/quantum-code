'use client';

import { LocalStorageHelper } from '@/platform/persistence/local-storage';
import { generateCode } from '@/platform/room';
import { createRoom } from '@/platform/room/room-client';
import { useLiveInputs } from '@/platform/room/use-live-room';
import { Button } from '@/platform/ui/Button';
import { Chip } from '@/platform/ui/Chip';
import { Eyebrow } from '@/platform/ui/Eyebrow';
import { RoomShare } from '@/platform/ui/RoomShare';
import { Spinner } from '@heroui/react';
import Link from 'next/link';
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BiGroup, BiHome, BiPlay } from 'react-icons/bi';
import { accentOf } from '../accents';
import {
    LIVE_ROOM_PAYLOAD,
    LivePlayer,
    ROSTER_ROUND,
    RosterEntry,
    rosterFromInputs,
} from './live-session';

/**
 * Shared host lobby for LIVE, phase-based games (Chispas, Sintonía…). It owns the part
 * every live game shares — create the room, show the join QR/code, and gather the roster
 * of named players in real time — then hands control to the game once the host presses
 * "Empezar":
 *
 *   creating → lobby (QR + live roster + start gate) → started (renders `children`)
 *
 * Unlike `PerPlayerHost` there is no up-front player-count step: players join dynamically
 * and appear by name as their phones register in the roster (input round 0). The chosen
 * code is persisted so a host reload resumes the same lobby (mid-game host state is the
 * game's own concern). A game only supplies how to render itself once started.
 */
interface LiveLobbyProps {
    game: string;
    gameName: string;
    emoji: string;
    /** Accent token (`manifest.accent`) so the lobby CTA matches the game's colour. */
    accent: string;
    minPlayers: number;
    maxPlayers: number;
    /** Optional one-line rules reminder shown under the roster. */
    hint?: string;
    /** Rendered once the host starts, with the room code and the roster snapshot. */
    children: (session: { code: number; players: LivePlayer[] }) => ReactNode;
}

type Phase = 'creating' | 'lobby' | 'started' | 'error';

const storageKey = (game: string) => `quantum:live-host:${game}`;

export function LiveLobby({
    game,
    gameName,
    emoji,
    accent,
    minPlayers,
    maxPlayers,
    hint,
    children,
}: LiveLobbyProps) {
    const acc = accentOf(accent);
    const [phase, setPhase] = useState<Phase>('creating');
    const [code, setCode] = useState<number | null>(null);
    const [startedPlayers, setStartedPlayers] = useState<LivePlayer[]>([]);

    const startNewRoom = useCallback(async () => {
        setPhase('creating');
        const fresh = generateCode();
        try {
            await createRoom(game, fresh, LIVE_ROOM_PAYLOAD);
            LocalStorageHelper.setLocalStorageItem(storageKey(game), { code: fresh });
            setCode(fresh);
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
        const persisted = LocalStorageHelper.getLocalStorageItem<{ code: number }>(storageKey(game));
        if (persisted?.code) {
            setCode(persisted.code);
            setPhase('lobby');
            // Re-ensure the room exists (TTL may have lapsed); SET NX is a no-op otherwise.
            createRoom(game, persisted.code, LIVE_ROOM_PAYLOAD).catch(() => {});
        } else {
            void startNewRoom();
        }
    }, [game, startNewRoom]);

    // Live roster: phones register `{ name }` under seat as they join.
    const rosterInputs = useLiveInputs<RosterEntry>({
        game,
        code,
        round: ROSTER_ROUND,
        active: phase === 'lobby',
    });
    const players = useMemo(() => rosterFromInputs(rosterInputs), [rosterInputs]);

    const start = useCallback(() => {
        setStartedPlayers(players);
        setPhase('started');
    }, [players]);

    if (phase === 'creating') {
        return (
            <div className="flex h-screen items-center justify-center">
                <Spinner color="secondary" label="Creando la sala…" />
            </div>
        );
    }

    if (phase === 'error') {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-4 px-6 text-center">
                <p className="text-lg text-gray-200">No se pudo crear la sala.</p>
                <Button variant="secondary" onPress={() => void startNewRoom()}>
                    Reintentar
                </Button>
            </div>
        );
    }

    if (phase === 'started' && code !== null) {
        return <>{children({ code, players: startedPlayers })}</>;
    }

    // lobby
    const enough = players.length >= minPlayers;
    const full = players.length >= maxPlayers;

    return (
        <main className="mx-auto flex min-h-screen max-w-md flex-col items-center gap-6 px-6 py-10 text-center">
            <div>
                <span className="text-5xl" aria-hidden="true">
                    {emoji}
                </span>
                <h1 className="mt-2 text-2xl font-bold text-white">{gameName}</h1>
            </div>

            {code !== null && <RoomShare code={code} game={game} gameName={gameName} qrSize={180} />}

            <section className="w-full" aria-live="polite">
                <div className="mb-2 flex items-center justify-center gap-2">
                    <Chip>
                        <BiGroup className={acc.text} size={16} />
                        <span>
                            {players.length}{' '}
                            {players.length === 1 ? 'jugador' : 'jugadores'}
                        </span>
                    </Chip>
                </div>
                {players.length === 0 ? (
                    <p className="text-sm text-gray-400">
                        Esperando a que se unan los jugadores…
                    </p>
                ) : (
                    <ul className="flex flex-wrap justify-center gap-2">
                        {players.map((player) => (
                            <li key={player.seat}>
                                <Chip className={acc.chip}>{player.name}</Chip>
                            </li>
                        ))}
                    </ul>
                )}
                {full && (
                    <p className="mt-2 text-xs text-amber-300">
                        Sala llena ({maxPlayers}). Los que se unan ahora esperarán a la próxima
                        partida.
                    </p>
                )}
            </section>

            <div className="flex w-full flex-col items-center gap-3">
                <Button
                    variant="accent"
                    accentClass={acc.solidButton}
                    className="w-full max-w-xs"
                    startContent={<BiPlay size={22} />}
                    onPress={start}
                    isDisabled={!enough}
                >
                    Empezar
                </Button>
                {!enough && (
                    <span className="text-xs text-gray-500">
                        Mínimo {minPlayers} jugadores para empezar
                    </span>
                )}
                <Button
                    variant="ghost"
                    as={Link}
                    href="/"
                    startContent={<BiHome size={18} />}
                >
                    Inicio
                </Button>
            </div>

            {hint && <p className="max-w-xs text-sm text-gray-400">{hint}</p>}
        </main>
    );
}
