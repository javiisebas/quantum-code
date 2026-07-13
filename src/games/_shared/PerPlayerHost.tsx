'use client';

import { accentOf } from '@/games/_shared/accents';
import { getManifest } from '@/games/registry';
import { LocalStorageHelper } from '@/platform/persistence/local-storage';
import { claimSeat, deleteRoom, openRoom, resumeRoom } from '@/platform/room/room-client';
import type { SeatClaim } from '@/platform/room/tokens';
import { isSeatClaim, seatStorageKey } from '@/platform/room/use-player-room';
import { useHeartbeat, useLiveCount } from '@/platform/room/use-presence';
import { Button, IconButton } from '@/platform/ui/Button';
import { Eyebrow } from '@/platform/ui/Eyebrow';
import { HostLobby } from '@/platform/ui/HostLobby';
import { HowToPlayButton } from '@/platform/ui/HowToPlay';
import { LobbyPanel } from '@/platform/ui/LobbyPanel';
import { Loading } from '@/platform/ui/Loading';
import { RoomError } from '@/platform/ui/RoomError';
import { Screen, ScreenBody } from '@/platform/ui/Screen';
import { Surface } from '@/platform/ui/Surface';
import { TopBar } from '@/platform/ui/TopBar';
import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { BiIdCard, BiJoystick, BiMinus, BiPlus, BiQr, BiRefresh } from 'react-icons/bi';

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
 * «YO TAMBIÉN JUEGO» (docs/host-also-plays.md, group 3): after dealing, the host screen shows
 * nothing a player needs — so the host can claim a seat like any phone and this device turns
 * into their own secret card. The card is projected LOCALLY (the payload was built right here,
 * and `project` is the same pure function the server runs for every phone), so playing as host
 * adds no fetch that could race the resume path. The seat claim itself is real and server-side,
 * exactly a phone's claim in the same storage slot, so seat numbers stay unique.
 *
 * KNOWN FLOW LIMITATION (deliberate, not an oversight): the deal is built at room-creation time,
 * so the room — and therefore the join code — does not exist until the host has picked the
 * player count. Guests cannot join while the host is counting heads. Fixing that properly means
 * dealing AFTER the roster fills (a host-authoritative payload rewrite plus polling phones),
 * which is a change to the sealed-secret path and belongs in its own pass.
 */
interface PerPlayerHostProps<T, V> {
    game: string;
    /** Build the shared payload for `count` players (one secret per seat). */
    build: (count: number) => T;
    /** Project the payload down to one seat's view — the same pure fn the server applies. */
    project: (payload: T, seat: number) => V;
    /**
     * Render this game's secret card for the host's own seat («Yo también juego»), with
     * `actions` mounted in its top bar — the way back to the room lives there.
     */
    card: (view: V, actions: ReactNode) => ReactNode;
}

interface PersistedRound<T> {
    code: number;
    count: number;
    payload: T;
    /** The host capability — required to release this room ("Nueva ronda") server-side. */
    hostToken?: string;
    /** «Yo también juego»: re-claim a seat for this device on resume and on every new round. */
    hostPlays?: boolean;
}

type Phase<T> =
    | { kind: 'config' }
    | { kind: 'creating' }
    | { kind: 'live'; code: number; payload: T; hostToken: string | null }
    | { kind: 'error' };

const storageKey = (game: string) => `quantum:host:${game}`;

export function PerPlayerHost<T, V>({ game, build, project, card }: PerPlayerHostProps<T, V>) {
    const manifest = getManifest(game);
    const minPlayers = manifest?.minPlayers ?? 3;
    const maxPlayers = manifest?.maxPlayers ?? 12;
    const acc = accentOf(manifest?.accent ?? 'purple');

    const [count, setCount] = useState(minPlayers);
    const [phase, setPhase] = useState<Phase<T>>({ kind: 'config' });

    // «Yo también juego»: the intent (it survives rounds — every new code needs a fresh claim),
    // this code's actual claim, and which face the host device is showing right now.
    const [hostPlays, setHostPlays] = useState(false);
    const [hostClaim, setHostClaim] = useState<SeatClaim | null>(null);
    const [hostView, setHostView] = useState<'card' | 'room'>('card');
    const [joining, setJoining] = useState(false);
    const [joinError, setJoinError] = useState<string | null>(null);

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
            if (persisted.hostPlays) {
                // Restore the host's own claim from the SAME slot a phone's would be in. The
                // card renders from the local payload, so it is valid this very frame — no read
                // of the room happens on this device, and nothing can 401 while resuming.
                const stored = LocalStorageHelper.getLocalStorageItem<unknown>(
                    seatStorageKey(game, persisted.code),
                );
                if (isSeatClaim(stored)) {
                    setHostClaim(stored);
                    setHostPlays(true);
                }
            }
            setPhase({
                kind: 'live',
                code: persisted.code,
                payload: persisted.payload,
                hostToken: persisted.hostToken ?? null,
            });
            // Re-ensure the room (and its code reservation) still exist — both may have lapsed
            // past their TTL — so late joiners can still connect to the resumed code. If it had to
            // be re-created, the server minted a fresh host token; adopt it, or "Nueva ronda" would
            // no longer be able to release this room.
            resumeRoom<T>(game, persisted.code, persisted.payload)
                .then(({ hostToken: minted }) => {
                    if (!minted) return;
                    setPhase((p) =>
                        p.kind === 'live' && p.code === persisted.code
                            ? { ...p, hostToken: minted }
                            : p,
                    );
                    LocalStorageHelper.setLocalStorageItem<PersistedRound<T>>(storageKey(game), {
                        ...persisted,
                        hostToken: minted,
                    });
                    if (persisted.hostPlays) {
                        // A minted token means the room was RE-created, and the seat counter was
                        // reborn with it: the claim this device held names a seat of the dead
                        // room. Discard it and claim again — first, before any phone re-scans.
                        LocalStorageHelper.removeLocalStorageItem(
                            seatStorageKey(game, persisted.code),
                        );
                        setHostClaim(null);
                        claimSeat(game, persisted.code)
                            .then((claim) => {
                                LocalStorageHelper.setLocalStorageItem(
                                    seatStorageKey(game, persisted.code),
                                    claim,
                                );
                                setHostClaim(claim);
                            })
                            .catch(() => {});
                    }
                })
                .catch(() => {});
        }
    }, [game]);

    const startRound = useCallback(
        async (players: number, hostAlsoPlays: boolean) => {
            setPhase({ kind: 'creating' });
            try {
                // The SERVER mints the code, so it is unique across the whole arcade and a
                // player can reach this room by typing six digits and nothing else.
                const {
                    code,
                    value: payload,
                    hostToken,
                } = await openRoom<T>(game, buildRef.current(players));
                // A playing host claims BEFORE the QR is even on screen, so they are always
                // seat 1 — a fresh deal can never fill up under the host.
                let claim: SeatClaim | null = null;
                if (hostAlsoPlays) {
                    try {
                        claim = await claimSeat(game, code);
                        LocalStorageHelper.setLocalStorageItem(seatStorageKey(game, code), claim);
                    } catch {
                        // The round is still perfectly playable — this device just spectates it.
                    }
                }
                LocalStorageHelper.setLocalStorageItem<PersistedRound<T>>(storageKey(game), {
                    code,
                    count: players,
                    payload,
                    hostToken: hostToken ?? undefined,
                    hostPlays: claim !== null,
                });
                setHostClaim(claim);
                setHostPlays(claim !== null);
                setHostView('card');
                setJoinError(null);
                setPhase({ kind: 'live', code, payload, hostToken });
            } catch {
                setPhase({ kind: 'error' });
            }
        },
        [game],
    );

    const newRound = useCallback(() => {
        if (phase.kind === 'live') {
            // Release the old room (and its code) before dealing a fresh one: the new deal must
            // not be readable at the old code, and the code goes back to the pool.
            // Host-authoritative, so it carries the host token; a missing/stale one just leaves
            // the old room to its TTL.
            if (phase.hostToken) {
                deleteRoom(game, phase.code, phase.hostToken).catch(() => {});
            }
            // Any claim this device held names a seat of the room that just died with its code.
            LocalStorageHelper.removeLocalStorageItem(seatStorageKey(game, phase.code));
        }
        void startRound(count, hostPlays);
    }, [phase, game, count, hostPlays, startRound]);

    // «Yo también juego», decided late from the lobby: claim the next seat exactly as a phone
    // would, into the same storage slot — from here on this device IS one of the players. The
    // intent is persisted, so every later round re-claims automatically at round creation.
    const joinRound = useCallback(async () => {
        if (phase.kind !== 'live' || joining) return;
        setJoining(true);
        setJoinError(null);
        try {
            const key = seatStorageKey(game, phase.code);
            const stored = LocalStorageHelper.getLocalStorageItem<unknown>(key);
            const claim = isSeatClaim(stored) ? stored : await claimSeat(game, phase.code);
            LocalStorageHelper.setLocalStorageItem(key, claim);
            setHostClaim(claim);
            setHostPlays(true);
            setHostView('card');
            const persisted = LocalStorageHelper.getLocalStorageItem<PersistedRound<T>>(
                storageKey(game),
            );
            if (persisted?.code === phase.code) {
                LocalStorageHelper.setLocalStorageItem<PersistedRound<T>>(storageKey(game), {
                    ...persisted,
                    hostPlays: true,
                });
            }
        } catch {
            setJoinError('No se pudo reclamar un asiento. Inténtalo de nuevo.');
        } finally {
            setJoining(false);
        }
    }, [phase, game, joining]);

    // Live presence: how many phones are currently connected to this room. Polls only while a
    // room is live (a null code makes the hook a no-op).
    const connected = useLiveCount({
        game,
        code: phase.kind === 'live' ? phase.code : null,
    });

    // The host is holding a PLAYABLE seat only when their claim falls inside the deal — a claim
    // past `count` means the table was already full when they pressed the button.
    const hostSeat = hostPlays && hostClaim && hostClaim.seat <= count ? hostClaim.seat : null;

    // While the host holds a playable seat they are one more phone in the room, so they
    // heartbeat like one — the roster and its connected count include them.
    useHeartbeat({
        game,
        code: phase.kind === 'live' && hostSeat !== null ? phase.code : null,
    });

    if (!manifest) {
        return <RoomError message="Este juego no existe." />;
    }

    if (phase.kind === 'creating') {
        return <Loading label="Repartiendo secretos…" />;
    }

    if (phase.kind === 'error') {
        return (
            <RoomError
                message="No se pudo crear la partida."
                onRetry={() => startRound(count, hostPlays)}
            />
        );
    }

    if (phase.kind === 'live') {
        // «Yo también juego», the card face: this device shows the host their OWN secret,
        // projected locally from the payload it built. The one way back to the room — QR,
        // roster, new round — rides the card's top bar, where a screen's controls live.
        if (hostSeat !== null && hostView === 'card') {
            return (
                <>
                    {card(
                        project(phase.payload, hostSeat),
                        <Button
                            variant="secondary"
                            size="md"
                            startContent={<BiQr size={18} />}
                            onPress={() => setHostView('room')}
                        >
                            Sala
                        </Button>,
                    )}
                </>
            );
        }

        // Phones have no names in these games (each one just claims a seat and reads its card),
        // so the roster shows seats. The ghost slots make "we're still waiting for two phones"
        // legible at a glance — the same language the live games' lobby speaks. The host's own
        // seat is the one exception: "which of these is me?" has an answer, so it is named.
        const seats = Array.from({ length: Math.min(connected, count) }, (_, i) =>
            hostSeat === i + 1 ? 'Tú (anfitrión)' : `Jugador ${i + 1}`,
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
                        <>
                            {hostSeat !== null ? (
                                <Button
                                    variant="secondary"
                                    fullWidth
                                    startContent={<BiIdCard size={20} />}
                                    onPress={() => setHostView('card')}
                                >
                                    Ver mi carta
                                </Button>
                            ) : hostPlays && hostClaim ? (
                                // They asked to play but the deal was already fully claimed —
                                // the persisted intent seats them the moment a new round deals.
                                <p className="text-center text-xs text-amber-300">
                                    Este reparto ya estaba completo: tendrás carta en la próxima
                                    ronda.
                                </p>
                            ) : (
                                <Button
                                    variant="secondary"
                                    fullWidth
                                    isDisabled={joining}
                                    startContent={<BiJoystick size={20} />}
                                    onPress={joinRound}
                                >
                                    Yo también juego
                                </Button>
                            )}
                            {joinError && (
                                <p className="text-center text-xs text-amber-300">{joinError}</p>
                            )}
                            <p className="text-center text-xs text-gray-500">
                                Reparte secretos nuevos con el mismo grupo.
                            </p>
                        </>
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
        // The page is the one rail so the CHROME spans it (a top bar squeezed into a 448px column
        // in the middle of a TV, with the game's name truncated, is not chrome — it's debris).
        // The card is what's capped, and it is the same `card` column every other one-card screen
        // in the arcade uses.
        <Screen>
            <TopBar
                emoji={manifest.emoji}
                title={manifest.name}
                right={<HowToPlayButton manifest={manifest} />}
            />
            <ScreenBody>
                <Surface className="flex w-full flex-col items-center gap-6 p-6 text-center sm:p-8">
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
                        onPress={() => startRound(count, hostPlays)}
                    >
                        Abrir sala
                    </Button>
                </Surface>
            </ScreenBody>
        </Screen>
    );
}
