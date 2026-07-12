'use client';

import { accentOf } from '@/games/_shared/accents';
import { LocalStorageHelper } from '@/platform/persistence/local-storage';
import { generateCode } from '@/platform/room';
import { createRoom, deleteRoom } from '@/platform/room/room-client';
import { useLiveCount } from '@/platform/room/use-presence';
import { Button, IconButton } from '@/platform/ui/Button';
import { Chip } from '@/platform/ui/Chip';
import { Eyebrow } from '@/platform/ui/Eyebrow';
import { RoomShare } from '@/platform/ui/RoomShare';
import { Spinner } from '@heroui/react';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BiGroup, BiHome, BiMinus, BiPlus, BiRefresh } from 'react-icons/bi';

/**
 * Shared host ("shared screen") lobby for per-player-secret games (Spyfall,
 * Undercover, Werewolf…). It owns the whole host lifecycle so a game only has to
 * describe HOW to build its payload for N players:
 *
 *   1. config phase → pick the number of players, press "Empezar";
 *   2. live phase    → show the join code + QR (the lobby the phones join), with
 *      "Nueva ronda" to re-deal and "Inicio" to leave.
 *
 * The room `{ code, payload, count }` is persisted so a host reload resumes the same
 * round. Every per-player game reuses this, which is what keeps their host screens
 * visually identical. The share surface (QR + code + copy/share) is delegated to the
 * shared <RoomShare>, so per-player games get the same copy/native-share shortcuts as
 * codenames for free.
 */
interface PerPlayerHostProps<T> {
    game: string;
    gameName: string;
    emoji: string;
    /** Accent token (`manifest.accent`) so the lobby CTAs match the game's colour. */
    accent: string;
    minPlayers: number;
    maxPlayers: number;
    /** Build the shared payload for `count` players (one secret per seat). */
    build: (count: number) => T;
    /** Optional per-game hint shown under the actions (e.g. a rules reminder). */
    hint?: string;
}

interface PersistedRound<T> {
    code: number;
    count: number;
    payload: T;
}

type Phase<T> =
    | { kind: 'config' }
    | { kind: 'creating' }
    | { kind: 'live'; code: number; payload: T }
    | { kind: 'error' };

const storageKey = (game: string) => `quantum:host:${game}`;

export function PerPlayerHost<T>({
    game,
    gameName,
    emoji,
    accent,
    minPlayers,
    maxPlayers,
    build,
    hint,
}: PerPlayerHostProps<T>) {
    const acc = accentOf(accent);
    const [count, setCount] = useState(minPlayers);
    const [phase, setPhase] = useState<Phase<T>>({ kind: 'config' });

    const buildRef = useRef(build);
    buildRef.current = build;

    // Resume a persisted round on mount (guard against StrictMode double-invoke).
    const bootstrappedRef = useRef(false);
    useEffect(() => {
        if (bootstrappedRef.current) return;
        bootstrappedRef.current = true;
        const persisted = LocalStorageHelper.getLocalStorageItem<PersistedRound<T>>(
            storageKey(game),
        );
        if (persisted?.code) {
            setCount(persisted.count);
            setPhase({ kind: 'live', code: persisted.code, payload: persisted.payload });
            // Re-ensure the room still exists in the store (it may have expired past its
            // TTL) so late joiners can connect to the resumed code. SET NX is a no-op
            // when it's still there.
            createRoom(game, persisted.code, persisted.payload).catch(() => {});
        }
    }, [game]);

    const startRound = useCallback(
        async (players: number) => {
            setPhase({ kind: 'creating' });
            const code = generateCode();
            const candidate = buildRef.current(players);
            try {
                const payload = await createRoom<T>(game, code, candidate);
                LocalStorageHelper.setLocalStorageItem<PersistedRound<T>>(storageKey(game), {
                    code,
                    count: players,
                    payload,
                });
                setPhase({ kind: 'live', code, payload });
            } catch {
                setPhase({ kind: 'error' });
            }
        },
        [game],
    );

    const newRound = useCallback(() => {
        if (phase.kind === 'live') deleteRoom(game, phase.code).catch(() => {});
        void startRound(count);
    }, [phase, game, count, startRound]);

    // Live presence: number of phones currently connected to this room. Polls only
    // while a room is live (null code → the hook is a no-op).
    const connected = useLiveCount({
        game,
        code: phase.kind === 'live' ? phase.code : null,
    });

    if (phase.kind === 'creating') {
        return (
            <div className="flex h-screen items-center justify-center">
                <Spinner color="secondary" label="Repartiendo secretos…" />
            </div>
        );
    }

    if (phase.kind === 'error') {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-4 px-6 text-center">
                <p className="text-lg text-gray-200">No se pudo crear la partida.</p>
                <Button variant="secondary" onPress={() => startRound(count)}>
                    Reintentar
                </Button>
            </div>
        );
    }

    if (phase.kind === 'live') {
        return (
            <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-6 py-12 text-center">
                <div>
                    <span className="text-5xl" aria-hidden="true">
                        {emoji}
                    </span>
                    <h1 className="mt-2 text-2xl font-bold text-white">{gameName}</h1>
                </div>

                <RoomShare code={phase.code} game={game} gameName={gameName} />

                <div aria-live="polite">
                    <Chip>
                        <BiGroup className="text-emerald-300" size={16} />
                        <span>
                            {connected}{' '}
                            {connected === 1 ? 'jugador conectado' : 'jugadores conectados'}
                        </span>
                    </Chip>
                </div>

                <div className="flex flex-wrap justify-center gap-3">
                    <Button
                        variant="accent"
                        accentClass={acc.solidButton}
                        startContent={<BiRefresh size={20} />}
                        onPress={newRound}
                    >
                        Nueva ronda
                    </Button>
                    <Button
                        variant="secondary"
                        as={Link}
                        href="/"
                        startContent={<BiHome size={20} />}
                    >
                        Inicio
                    </Button>
                </div>

                {hint && <p className="max-w-xs text-sm text-gray-400">{hint}</p>}
            </main>
        );
    }

    // config phase
    const dec = () => setCount((c) => Math.max(minPlayers, c - 1));
    const inc = () => setCount((c) => Math.min(maxPlayers, c + 1));

    return (
        <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-8 px-6 py-12 text-center">
            <div>
                <span className="text-6xl" aria-hidden="true">
                    {emoji}
                </span>
                <h1 className="mt-3 text-3xl font-bold text-white">{gameName}</h1>
            </div>

            <div className="flex flex-col items-center gap-3">
                <Eyebrow>Número de jugadores</Eyebrow>
                <div className="flex items-center gap-6">
                    <IconButton
                        aria-label="Menos jugadores"
                        onPress={dec}
                        isDisabled={count <= minPlayers}
                    >
                        <BiMinus size={22} />
                    </IconButton>
                    <span className="w-14 font-mono text-5xl font-bold text-white">{count}</span>
                    <IconButton
                        aria-label="Más jugadores"
                        onPress={inc}
                        isDisabled={count >= maxPlayers}
                    >
                        <BiPlus size={22} />
                    </IconButton>
                </div>
                <span className="text-xs text-gray-500">
                    entre {minPlayers} y {maxPlayers}
                </span>
            </div>

            <Button
                variant="accent"
                accentClass={acc.solidButton}
                className="w-full max-w-xs"
                onPress={() => startRound(count)}
            >
                Empezar partida
            </Button>
        </main>
    );
}
