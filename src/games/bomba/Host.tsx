'use client';

import { usePublishedState, useLiveInputs } from '@/platform/room/use-live-room';
import { Button } from '@/platform/ui/Button';
import { Chip } from '@/platform/ui/Chip';
import { Eyebrow } from '@/platform/ui/Eyebrow';
import { Surface } from '@/platform/ui/Surface';
import { ClassnameHelper } from '@/platform/util/classnames';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import Confetti from 'react-confetti';
import { BiHome } from 'react-icons/bi';
import { accentOf } from '../_shared/accents';
import { LiveLobby } from '../_shared/live/LiveLobby';
import type { LivePlayer } from '../_shared/live/live-session';
import {
    BombaGame,
    BombaScore,
    BombaState,
    explode,
    initGame,
    nextRound,
    passBomb,
    passRound,
    randomFuse,
    scoreboard,
} from './domain';
import { BOMBA_ID, bombaManifest } from './manifest';

const acc = accentOf(bombaManifest.accent);

/** How long the 💥 reveal lingers before the host auto-starts the next round. */
const EXPLOSION_PAUSE_MS = 5_000;

/** La Bomba host: gather players in the shared lobby, then drive the live game. */
export function BombaHost() {
    return (
        <LiveLobby
            game={BOMBA_ID}
            gameName={bombaManifest.name}
            emoji={bombaManifest.emoji}
            accent={bombaManifest.accent}
            minPlayers={bombaManifest.minPlayers}
            maxPlayers={bombaManifest.maxPlayers}
            hint="Por turnos, di algo de la categoría en alto y pasa la bomba en tu móvil antes de que explote."
        >
            {({ code, players, hostToken }) => (
                <BombaBoard code={code} players={players} hostToken={hostToken} />
            )}
        </LiveLobby>
    );
}

function BombaBoard({
    code,
    players,
    hostToken,
}: {
    code: number;
    players: LivePlayer[];
    hostToken: string;
}) {
    // One round per player, floored at 5 so even a trio gets a full, well-separated game: each
    // round is exactly one explosion (one strike), so this scales the length to the group and
    // gives the "fewest strikes" ranking enough signal, all inside the ~10 min budget. Fewest
    // strikes wins.
    const totalRounds = Math.max(5, players.length);
    const seats = useMemo(() => players.map((player) => player.seat), [players]);

    const [game, setGame] = useState<BombaGame>(() => initGame(totalRounds, seats));
    // Per-game generation: bumped by "Jugar otra vez" so a replay in the SAME room never reads
    // the previous game's passes (round numbers repeat across replays).
    const [gen, setGen] = useState(0);

    // Publish only the public projection — the fuse deadline is NEVER here (it lives in the
    // arm-effect's closure below), so phones can't tell when the bomb will blow. Memoized so it
    // re-publishes only on real transitions, not on every input poll.
    const publicState = useMemo<BombaState>(
        () => ({
            phase: game.phase,
            gen,
            round: game.round,
            totalRounds,
            players,
            category: game.category,
            holderSeat: game.holderSeat,
            pass: game.pass,
            lastExploded: game.phase === 'explosion' ? game.lastExploded ?? undefined : undefined,
            scores:
                game.phase === 'explosion' || game.phase === 'final'
                    ? scoreboard(players, game.strikes)
                    : undefined,
        }),
        [game, players, gen, totalRounds],
    );
    usePublishedState({ game: BOMBA_ID, code, state: publicState, hostToken });

    // Arm the round's HIDDEN fuse. The duration lives only in this closure — never in React
    // state, never a ref that publishes — so it cannot leak. Keyed on phase alone: every round
    // passes through 'explosion' before the next 'playing', so re-entering 'playing' re-arms a
    // fresh fuse, while passing the bomb (holderSeat/pass change, phase stays 'playing') does
    // NOT re-run this effect — the fuse keeps ticking and a pass never resets it.
    useEffect(() => {
        if (game.phase !== 'playing') return;
        const timer = setTimeout(() => {
            setGame((g) => (g.phase === 'playing' ? explode(g) : g));
        }, randomFuse());
        return () => clearTimeout(timer);
    }, [game.phase]);

    // After the 💥 reveal lingers, auto-start the next round (or the final podium).
    useEffect(() => {
        if (game.phase !== 'explosion') return;
        const timer = setTimeout(() => {
            setGame((g) => (g.phase === 'explosion' ? nextRound(g) : g));
        }, EXPLOSION_PAUSE_MS);
        return () => clearTimeout(timer);
    }, [game.phase]);

    // The holder taps "¡Pasar!" → writes `{ token: <current pass> }` under this round's bucket.
    const passInputs = useLiveInputs<{ token?: number }>({
        game: BOMBA_ID,
        code,
        round: passRound(gen, game.round),
        active: game.phase === 'playing',
        hostToken,
    });

    // Advance the bomb exactly once per tap. The holder's token must equal the CURRENT pass
    // counter; advancing bumps the counter, so the same stored token no longer matches — a
    // re-poll or a duplicate submit can't double-advance (idempotent per (round, pass)). Passes
    // from non-holders are ignored: we only ever read the current holder's field.
    useEffect(() => {
        if (game.phase !== 'playing') return;
        if (passInputs[game.holderSeat]?.token !== game.pass) return;
        setGame((g) => {
            // Re-check against the freshest state so a double-fire can't advance twice.
            if (g.phase !== 'playing') return g;
            if (passInputs[g.holderSeat]?.token !== g.pass) return g;
            return passBomb(g);
        });
    }, [passInputs, game.phase, game.holderSeat, game.pass]);

    const restart = () => {
        setGen((g) => g + 1);
        setGame(initGame(totalRounds, seats));
    };

    const holder = players.find((player) => player.seat === game.holderSeat);
    const exploded = players.find((player) => player.seat === game.lastExploded);

    return (
        <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-5 py-8">
            <header className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-2xl" aria-hidden="true">
                        {bombaManifest.emoji}
                    </span>
                    <span className="text-lg font-bold text-white">{bombaManifest.name}</span>
                </div>
                {game.phase !== 'final' && (
                    <Chip className={acc.chip}>
                        Ronda {game.round}/{totalRounds}
                    </Chip>
                )}
            </header>

            <div className="flex flex-1 flex-col justify-center py-6">
                {game.phase === 'playing' && (
                    <PlayingStage category={game.category} holderName={holder?.name ?? '—'} />
                )}
                {game.phase === 'explosion' && (
                    <ExplosionStage
                        explodedName={exploded?.name ?? '—'}
                        scores={scoreboard(players, game.strikes)}
                        isLast={game.round >= totalRounds}
                    />
                )}
                {game.phase === 'final' && (
                    <FinalStage scores={scoreboard(players, game.strikes)} onRestart={restart} />
                )}
            </div>
        </main>
    );
}

function ConfettiBurst() {
    return (
        <div className="pointer-events-none fixed inset-0 z-50">
            <Confetti
                recycle={false}
                numberOfPieces={260}
                gravity={0.25}
                colors={['#f97316', '#fb923c', '#fdba74', '#fed7aa', '#ffffff']}
            />
        </div>
    );
}

/** The category card, reused across the tense phase and (smaller) the reveal. */
function CategoryCard({ category, size = 'lg' }: { category: string; size?: 'lg' | 'sm' }) {
    return (
        <Surface className={ClassnameHelper.join('w-full p-6 text-center', size === 'lg' && 'py-8')}>
            <Eyebrow className={acc.text}>La categoría</Eyebrow>
            <p
                className={ClassnameHelper.join(
                    'mt-2 font-extrabold text-white',
                    size === 'lg' ? 'text-2xl sm:text-3xl' : 'text-lg',
                )}
            >
                {category}
            </p>
        </Surface>
    );
}

function PlayingStage({ category, holderName }: { category: string; holderName: string }) {
    return (
        <div className="flex flex-col items-center gap-6">
            <CategoryCard category={category} />

            {/*
             * A nervous, NON-accelerating shake: the animation is a constant loop with no link
             * to the hidden fuse, so watching the bomb never reveals how long is left.
             */}
            <motion.div
                aria-hidden="true"
                className="text-8xl drop-shadow-[0_0_35px_rgba(249,115,22,0.45)]"
                animate={{ rotate: [-8, 8, -8], scale: [1, 1.08, 1] }}
                transition={{ duration: 0.35, repeat: Infinity, ease: 'easeInOut' }}
            >
                💣
            </motion.div>

            <div className="text-center">
                <Eyebrow className={acc.text}>La bomba la tiene</Eyebrow>
                <p className="mt-1 text-4xl font-extrabold text-white">{holderName}</p>
                <p className="mt-3 max-w-xs text-sm text-gray-400">
                    Di algo de la categoría en alto y pásala rápido en tu móvil. ¡Que no te pille!
                </p>
            </div>
        </div>
    );
}

function ExplosionStage({
    explodedName,
    scores,
    isLast,
}: {
    explodedName: string;
    scores: BombaScore[];
    isLast: boolean;
}) {
    return (
        <div className="flex flex-col items-center gap-6 text-center">
            <motion.div
                aria-hidden="true"
                className="text-8xl"
                initial={{ scale: 0.4, rotate: -12 }}
                animate={{ scale: [0.4, 1.25, 1], rotate: [-12, 6, 0] }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
            >
                💥
            </motion.div>
            <div>
                <p className="text-3xl font-extrabold text-white">¡BOOM!</p>
                <p className={ClassnameHelper.join('mt-1 text-xl font-bold', acc.text)}>
                    {explodedName} se ha quedado con la bomba
                </p>
                <p className="mt-1 text-sm text-gray-400">+1 bombazo</p>
            </div>

            <StrikeBoard scores={scores} />

            <p className="text-sm text-gray-500">
                {isLast ? 'Calculando la clasificación final…' : 'Preparando la siguiente ronda…'}
            </p>
        </div>
    );
}

/** Strike standings as chips (fewest first). The leader (fewest bombazos) is tinted. */
function StrikeBoard({ scores }: { scores: BombaScore[] }) {
    return (
        <div className="flex flex-wrap justify-center gap-2">
            {scores.map((s, i) => (
                <Chip key={s.seat} className={i === 0 ? acc.chip : undefined}>
                    <span className="font-semibold">{s.name}</span>
                    <span className="text-gray-400">·</span>
                    <span>💣 {s.strikes}</span>
                </Chip>
            ))}
        </div>
    );
}

function FinalStage({ scores, onRestart }: { scores: BombaScore[]; onRestart: () => void }) {
    const champion = scores[0];
    return (
        <div className="flex flex-col items-center gap-6 text-center">
            <ConfettiBurst key="final" />
            <div>
                <span className="text-6xl" aria-hidden="true">
                    🏆
                </span>
                <Eyebrow className="mt-3">Quien menos explotó</Eyebrow>
                <h1 className="mt-1 text-4xl font-extrabold text-orange-300">
                    {champion?.name ?? '—'}
                </h1>
                {champion && (
                    <p className="mt-1 text-sm text-gray-400">
                        {champion.strikes} {champion.strikes === 1 ? 'bombazo' : 'bombazos'}
                    </p>
                )}
            </div>

            <ol className="flex w-full max-w-sm flex-col gap-2">
                {scores.map((s, i) => (
                    <li key={s.seat}>
                        <Surface
                            tone={i === 0 ? 'plain' : 'inset'}
                            radius="2xl"
                            className={ClassnameHelper.join(
                                'flex items-center gap-3 p-3',
                                i === 0 && 'bg-orange-500/15 ring-1 ring-inset ring-orange-400/40',
                            )}
                        >
                            <span className="w-6 text-center font-mono text-lg font-bold text-gray-400">
                                {i + 1}
                            </span>
                            <span className="flex-1 text-left font-semibold text-white">{s.name}</span>
                            <span className={ClassnameHelper.join('font-bold', acc.text)}>
                                💣 {s.strikes}
                            </span>
                        </Surface>
                    </li>
                ))}
            </ol>

            <div className="flex flex-wrap justify-center gap-3">
                <Button variant="accent" accentClass={acc.solidButton} onPress={onRestart}>
                    Jugar otra vez
                </Button>
                <Button variant="secondary" as={Link} href="/" startContent={<BiHome size={18} />}>
                    Inicio
                </Button>
            </div>
        </div>
    );
}
