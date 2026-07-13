'use client';

import { accentOf } from '@/games/_shared/accents';
import { getManifest } from '@/games/registry';
import { LocalStorageHelper } from '@/platform/persistence/local-storage';
import { deleteRoom, openRoom, resumeRoom } from '@/platform/room/room-client';
import { useLiveCount } from '@/platform/room/use-presence';
import { Button, IconButton } from '@/platform/ui/Button';
import { Eyebrow } from '@/platform/ui/Eyebrow';
import { HostLobby } from '@/platform/ui/HostLobby';
import { HowToPlayButton } from '@/platform/ui/HowToPlay';
import { LobbyPanel } from '@/platform/ui/LobbyPanel';
import { Loading } from '@/platform/ui/Loading';
import { RoomError } from '@/platform/ui/RoomError';
import { Screen } from '@/platform/ui/Screen';
import { Surface } from '@/platform/ui/Surface';
import { TopBar } from '@/platform/ui/TopBar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BiMinus, BiPlus, BiRefresh } from 'react-icons/bi';

/**
 * Shared host ("shared screen") lobby for per-player-secret games (Spyfall, Undercover,
 * Werewolf, El Camaleón). It owns the whole host lifecycle so a game only has to describe HOW
 * to build its payload for N players:
 *
 *   1. config phase → how many are playing? (the deal is built for exactly that many seats);
 *   2. live phase   → the shared <HostLobby>: the way in on the left, who has connected and
 *      "Nueva ronda" on the right.
 *
 * The live phase is the SAME `<HostLobby>` the live games use, so all eight games in the arcade
 * wait in a lobby that looks and behaves identically — that shared chrome is the whole point of
 * this file existing.
 *
 * The room `{ code, payload, count }` is persisted so a host reload resumes the same round.
 *
 * KNOWN FLOW LIMITATION (deliberate, not an oversight): the deal is built at room-creation time,
 * so the room — and therefore the join code — does not exist until the host has picked the
 * player count. Guests cannot join while the host is counting heads. Fixing that properly means
 * dealing AFTER the roster fills (a host-authoritative payload rewrite plus polling phones),
 * which is a change to the sealed-secret path and belongs in its own pass.
 */
interface PerPlayerHostProps<T> {
    game: string;
    /** Build the shared payload for `count` players (one secret per seat). */
    build: (count: number) => T;
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

export function PerPlayerHost<T>({ game, build }: PerPlayerHostProps<T>) {
    const manifest = getManifest(game);
    const minPlayers = manifest?.minPlayers ?? 3;
    const maxPlayers = manifest?.maxPlayers ?? 12;
    const acc = accentOf(manifest?.accent ?? 'purple');

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
            // Re-ensure the room (and its code reservation) still exist — both may have lapsed
            // past their TTL — so late joiners can still connect to the resumed code.
            resumeRoom(game, persisted.code, persisted.payload).catch(() => {});
        }
    }, [game]);

    const startRound = useCallback(
        async (players: number) => {
            setPhase({ kind: 'creating' });
            try {
                // The SERVER mints the code, so it is unique across the whole arcade and a
                // player can reach this room by typing six digits and nothing else.
                const { code, value: payload } = await openRoom<T>(game, buildRef.current(players));
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
        // Release the old room (and its code) before dealing a fresh one: the new deal must not
        // be readable at the old code, and the code goes back to the pool.
        if (phase.kind === 'live') deleteRoom(game, phase.code).catch(() => {});
        void startRound(count);
    }, [phase, game, count, startRound]);

    // Live presence: how many phones are currently connected to this room. Polls only while a
    // room is live (a null code makes the hook a no-op).
    const connected = useLiveCount({
        game,
        code: phase.kind === 'live' ? phase.code : null,
    });

    if (!manifest) {
        return <RoomError message="Este juego no existe." />;
    }

    if (phase.kind === 'creating') {
        return <Loading label="Repartiendo secretos…" />;
    }

    if (phase.kind === 'error') {
        return (
            <RoomError message="No se pudo crear la partida." onRetry={() => startRound(count)} />
        );
    }

    if (phase.kind === 'live') {
        // Phones have no names in these games (each one just claims a seat and reads its card),
        // so the roster shows seats. The ghost slots make "we're still waiting for two phones"
        // legible at a glance — the same language the live games' lobby speaks.
        const seats = Array.from(
            { length: Math.min(connected, count) },
            (_, i) => `Jugador ${i + 1}`,
        );
        return (
            <HostLobby manifest={manifest} code={phase.code}>
                <LobbyPanel
                    names={seats}
                    min={count}
                    max={count}
                    accentChip={acc.chip}
                    action={
                        <Button
                            variant="accent"
                            accentClass={acc.solidButton}
                            fullWidth
                            startContent={<BiRefresh size={20} />}
                            onPress={newRound}
                        >
                            Nueva ronda
                        </Button>
                    }
                    footer={
                        <p className="text-center text-xs text-gray-500">
                            Reparte secretos nuevos con el mismo grupo.
                        </p>
                    }
                />
            </HostLobby>
        );
    }

    // Config phase: the deal has to know how many seats it is for, so this comes before the room
    // (and therefore before the code) exists.
    const dec = () => setCount((c) => Math.max(minPlayers, c - 1));
    const inc = () => setCount((c) => Math.min(maxPlayers, c + 1));

    return (
        // The page is full-width so the CHROME spans it (a top bar squeezed into a 448px column
        // in the middle of a TV, with the game's name truncated, is not chrome — it's debris).
        // The card is what's capped.
        <Screen width="full" height="fit">
            <TopBar
                emoji={manifest.emoji}
                title={manifest.name}
                right={<HowToPlayButton manifest={manifest} />}
            />
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6 py-4">
                <Surface className="flex w-full max-w-md flex-col items-center gap-6 p-6 text-center sm:p-8">
                    <div className="flex flex-col items-center gap-1">
                        <Eyebrow as="h2">¿Cuántos jugáis?</Eyebrow>
                        <p className="text-sm text-gray-400">
                            Repartiremos un secreto para cada uno.
                        </p>
                    </div>

                    <div className="flex items-center gap-6">
                        <IconButton
                            aria-label="Menos jugadores"
                            onPress={dec}
                            isDisabled={count <= minPlayers}
                        >
                            <BiMinus size={22} />
                        </IconButton>
                        <span className="w-16 font-mono text-5xl font-bold tabular-nums text-white">
                            {count}
                        </span>
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

                    <Button
                        variant="accent"
                        accentClass={acc.solidButton}
                        fullWidth
                        onPress={() => startRound(count)}
                    >
                        Abrir sala
                    </Button>
                </Surface>
            </div>
        </Screen>
    );
}
