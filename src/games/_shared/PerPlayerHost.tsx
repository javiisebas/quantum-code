'use client';

import { LocalStorageHelper } from '@/platform/persistence/local-storage';
import { generateCode } from '@/platform/room';
import { createRoom, deleteRoom } from '@/platform/room/room-client';
import { useLiveCount } from '@/platform/room/use-presence';
import { ClassnameHelper } from '@/platform/util/classnames';
import { Button, Spinner } from '@heroui/react';
import { QRCodeSVG } from 'qrcode.react';
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
 * visually identical.
 */
interface PerPlayerHostProps<T> {
    game: string;
    gameName: string;
    emoji: string;
    minPlayers: number;
    maxPlayers: number;
    /** Build the shared payload for `count` players (one secret per seat). */
    build: (count: number) => T;
    /** Optional per-game hint shown under the code (e.g. rules reminder). */
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
    minPlayers,
    maxPlayers,
    build,
    hint,
}: PerPlayerHostProps<T>) {
    const [count, setCount] = useState(minPlayers);
    const [phase, setPhase] = useState<Phase<T>>({ kind: 'config' });
    const [origin, setOrigin] = useState('');

    const buildRef = useRef(build);
    buildRef.current = build;

    useEffect(() => {
        setOrigin(window.location.origin);
    }, []);

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
                <Button color="secondary" onPress={() => startRound(count)}>
                    Reintentar
                </Button>
            </div>
        );
    }

    if (phase.kind === 'live') {
        const joinUrl = origin ? `${origin}/join/${game}?code=${phase.code}` : '';
        return (
            <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-6 px-6 py-12 text-center">
                <div>
                    <span className="text-5xl" aria-hidden="true">
                        {emoji}
                    </span>
                    <h1 className="mt-2 text-2xl font-bold text-white">{gameName}</h1>
                </div>

                {joinUrl ? (
                    <div className="rounded-2xl bg-white p-4 shadow-lg">
                        <QRCodeSVG value={joinUrl} size={200} level="M" marginSize={0} />
                    </div>
                ) : (
                    <div className="h-[232px] w-[232px] animate-pulse rounded-2xl bg-white/10" />
                )}

                <div className="flex flex-col items-center gap-1">
                    <span className="text-xs uppercase tracking-widest text-gray-400">Código</span>
                    <span className="font-mono text-5xl font-bold tracking-[0.2em] text-white">
                        {phase.code}
                    </span>
                </div>

                <div
                    className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 ring-1 ring-inset ring-white/10"
                    aria-live="polite"
                >
                    <BiGroup className="text-emerald-300" size={18} />
                    <span className="text-sm font-semibold text-white">
                        {connected} {connected === 1 ? 'jugador conectado' : 'jugadores conectados'}
                    </span>
                </div>

                <p className="max-w-xs text-sm text-gray-400">
                    Cada jugador entra en <span className="font-semibold text-gray-200">/join</span>,
                    elige {gameName} y mete el código.{hint ? ` ${hint}` : ''}
                </p>

                <div className="mt-2 flex gap-3">
                    <Button
                        color="secondary"
                        size="lg"
                        startContent={<BiRefresh size={20} />}
                        onPress={newRound}
                    >
                        Nueva ronda
                    </Button>
                    <Button
                        as={Link}
                        href="/"
                        size="lg"
                        variant="bordered"
                        className="border-white/20 text-white"
                        startContent={<BiHome size={20} />}
                    >
                        Inicio
                    </Button>
                </div>
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
                <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                    Número de jugadores
                </span>
                <div className="flex items-center gap-6">
                    <Button
                        isIconOnly
                        size="lg"
                        radius="full"
                        aria-label="Menos jugadores"
                        onPress={dec}
                        isDisabled={count <= minPlayers}
                        className={ClassnameHelper.join(
                            'bg-white/5 text-white ring-1 ring-inset ring-white/10',
                            'hover:bg-white/10',
                        )}
                    >
                        <BiMinus size={22} />
                    </Button>
                    <span className="w-14 font-mono text-5xl font-bold text-white">{count}</span>
                    <Button
                        isIconOnly
                        size="lg"
                        radius="full"
                        aria-label="Más jugadores"
                        onPress={inc}
                        isDisabled={count >= maxPlayers}
                        className={ClassnameHelper.join(
                            'bg-white/5 text-white ring-1 ring-inset ring-white/10',
                            'hover:bg-white/10',
                        )}
                    >
                        <BiPlus size={22} />
                    </Button>
                </div>
                <span className="text-xs text-gray-500">
                    entre {minPlayers} y {maxPlayers}
                </span>
            </div>

            <Button
                color="secondary"
                size="lg"
                className="w-full max-w-xs bg-purple-700 font-semibold text-white hover:bg-purple-600"
                onPress={() => startRound(count)}
            >
                Empezar partida
            </Button>
        </main>
    );
}
