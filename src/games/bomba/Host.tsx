'use client';

import { usePublishedState, useLiveInputs } from '@/platform/room/use-live-room';
import { Eyebrow } from '@/platform/ui/Eyebrow';
import { Podium, PodiumEntry, ScoreChips } from '@/platform/ui/Podium';
import { Surface } from '@/platform/ui/Surface';
import { ClassnameHelper } from '@/platform/util/classnames';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { accentOf } from '../_shared/accents';
import { LiveBoard } from '../_shared/live/LiveBoard';
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

const strikeLabel = (count: number) => `${count} ${count === 1 ? 'bombazo' : 'bombazos'}`;

/** A strike tally as a ranked row: the bomb IS the unit here, so it reads "💣 2". */
const entry = (score: BombaScore): PodiumEntry => ({
    id: score.seat,
    name: score.name,
    score: `💣 ${score.strikes}`,
});

/** La Bomba host: gather players in the shared lobby, then drive the live game. */
export function BombaHost() {
    return (
        <LiveLobby
            game={BOMBA_ID}
            minPlayers={bombaManifest.minPlayers}
            maxPlayers={bombaManifest.maxPlayers}
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
            lastExploded: game.phase === 'explosion' ? (game.lastExploded ?? undefined) : undefined,
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
    const scores = scoreboard(players, game.strikes);
    const champion = scores[0];

    return (
        <LiveBoard
            manifest={bombaManifest}
            accentChip={acc.chip}
            round={game.phase === 'final' ? null : game.round}
            totalRounds={totalRounds}
        >
            {game.phase === 'playing' && (
                <PlayingStage category={game.category} holderName={holder?.name ?? '—'} />
            )}
            {game.phase === 'explosion' && (
                <ExplosionStage
                    explodedName={exploded?.name ?? '—'}
                    scores={scores}
                    isLast={game.round >= totalRounds}
                />
            )}
            {game.phase === 'final' && (
                <Podium
                    accent={acc}
                    label="Quien menos explotó"
                    caption={champion && strikeLabel(champion.strikes)}
                    entries={scores.map(entry)}
                    onRestart={restart}
                />
            )}
        </LiveBoard>
    );
}

function PlayingStage({ category, holderName }: { category: string; holderName: string }) {
    return (
        <div className="flex w-full flex-col items-center gap-6 short:gap-4">
            <Surface className="w-full p-6 py-8 text-center short:py-5">
                <Eyebrow className={acc.text}>La categoría</Eyebrow>
                <p className="mt-2 text-2xl font-extrabold text-white sm:text-3xl">{category}</p>
            </Surface>

            {/*
             * A nervous, NON-accelerating shake: the animation is a constant loop with no link
             * to the hidden fuse, so watching the bomb never reveals how long is left.
             */}
            <motion.div
                aria-hidden="true"
                className="text-8xl drop-shadow-[0_0_35px_rgba(249,115,22,0.45)] short:text-6xl"
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
        <div className="flex w-full flex-col items-center gap-6 text-center short:gap-4">
            <motion.div
                aria-hidden="true"
                className="text-8xl short:text-6xl"
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

            <ScoreChips entries={scores.map(entry)} accentChip={acc.chip} />

            <p className="text-sm text-gray-500">
                {isLast ? 'Calculando la clasificación final…' : 'Preparando la siguiente ronda…'}
            </p>
        </div>
    );
}
