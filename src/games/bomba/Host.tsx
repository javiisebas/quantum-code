'use client';

import { usePublishedState, useLiveInputs } from '@/platform/room/use-live-room';
import { Chip } from '@/platform/ui/Chip';
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
                    caption={champion && `💣 ${strikeLabel(champion.strikes)}`}
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

/**
 * The between-round payoff, and the moment the whole round was building to: the fuse ran out on
 * SOMEONE. It gets ~5 seconds of everyone's attention (`EXPLOSION_PAUSE_MS`) before the next
 * round starts, so it is staged as a beat rather than listed as a fact:
 *
 *  - a shockwave — the accent `highlight` disc blown outwards under the 💥 — so the hit lands;
 *  - the victim as the headline, and the strike as a badge that pops in a beat later;
 *  - the standings underneath, unanimated, because five seconds is all the room gets to read them;
 *  - a bar draining over exactly the pause, so the group can SEE the next round coming instead of
 *    wondering whether the screen is stuck.
 */
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
        <div className="flex w-full flex-col items-center gap-5 text-center short:gap-4">
            <div className="relative flex h-28 w-28 items-center justify-center short:h-20 short:w-20">
                <motion.span
                    aria-hidden="true"
                    // `highlight` carries both the tint and the ring colour, so the shockwave is
                    // the game's accent without a single new token.
                    className={ClassnameHelper.join(
                        'absolute inset-0 rounded-full ring-2',
                        acc.highlight,
                    )}
                    initial={{ scale: 0.35, opacity: 0.9 }}
                    animate={{ scale: 2, opacity: 0 }}
                    transition={{ duration: 0.9, ease: 'easeOut' }}
                />
                <motion.span
                    aria-hidden="true"
                    className="text-8xl short:text-6xl"
                    initial={{ scale: 0.4, rotate: -12 }}
                    animate={{ scale: [0.4, 1.25, 1], rotate: [-12, 6, 0] }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                >
                    💥
                </motion.span>
            </div>

            <div>
                <p className="text-3xl font-extrabold text-white short:text-2xl">¡BOOM!</p>
                <p className={ClassnameHelper.join('mt-1 text-xl font-bold', acc.text)}>
                    {explodedName} se ha quedado con la bomba
                </p>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 320, damping: 16, delay: 0.35 }}
            >
                <Chip className={acc.chip}>💣 +1 bombazo</Chip>
            </motion.div>

            <ScoreChips entries={scores.map(entry)} accentChip={acc.chip} />

            <div className="flex w-full max-w-xs flex-col items-center gap-2">
                <p className="text-sm text-gray-500">
                    {isLast
                        ? 'Calculando la clasificación final…'
                        : 'Preparando la siguiente ronda…'}
                </p>
                {/*
                 * `bg-current` takes the accent from `acc.text` — the bar is the game's colour
                 * without inventing a token for it. It drains for exactly the pause the host
                 * effect above waits; under reduced motion it simply stays full, which says
                 * nothing false (the copy above already says what is happening).
                 */}
                <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
                    <motion.div
                        className={ClassnameHelper.join(
                            'h-full origin-left rounded-full bg-current',
                            acc.text,
                        )}
                        initial={{ scaleX: 1 }}
                        animate={{ scaleX: 0 }}
                        transition={{ duration: EXPLOSION_PAUSE_MS / 1000, ease: 'linear' }}
                    />
                </div>
            </div>
        </div>
    );
}
