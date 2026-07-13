'use client';

import { usePublishedPrivate, usePublishedState } from '@/platform/room/use-live-room';
import { Button } from '@/platform/ui/Button';
import { ConfettiBurst } from '@/platform/ui/Confetti';
import { Eyebrow } from '@/platform/ui/Eyebrow';
import { Podium, PodiumEntry, ScoreChips } from '@/platform/ui/Podium';
import { RangeInput } from '@/platform/ui/RangeInput';
import { Surface } from '@/platform/ui/Surface';
import { ClassnameHelper } from '@/platform/util/classnames';
import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { accentOf } from '../_shared/accents';
import { LiveBoard } from '../_shared/live/LiveBoard';
import { LiveLobby } from '../_shared/live/LiveLobby';
import type { LivePlayer } from '../_shared/live/live-session';
import { SpectrumBar } from './SpectrumBar';
import type { Spectrum } from './spectrums';
import {
    applyScore,
    pickSpectrums,
    randomTarget,
    Score,
    scoreboard,
    scoreGuess,
    SintoniaPhase,
    SintoniaState,
} from './domain';
import { SINTONIA_ID, sintoniaManifest } from './manifest';

const acc = accentOf(sintoniaManifest.accent);

/** A points tally as a ranked row. The unit rides along so `12` reads as `12 pts` at a glance. */
const entry = (score: Score): PodiumEntry => ({
    id: score.seat,
    name: score.name,
    score: score.score,
    unit: 'pts',
});

/** Sintonía host: gather players in the lobby, then drive the spectrum game. */
export function SintoniaHost() {
    return (
        <LiveLobby
            game={SINTONIA_ID}
            minPlayers={sintoniaManifest.minPlayers}
            maxPlayers={sintoniaManifest.maxPlayers}
        >
            {({ code, players, hostToken }) => (
                <SintoniaGame code={code} players={players} hostToken={hostToken} />
            )}
        </LiveLobby>
    );
}

interface HostGame {
    spectrums: Spectrum[];
    targets: number[];
    round: number;
    phase: SintoniaPhase;
    scores: Record<number, number>;
    reveal: { dial: number; points: number } | null;
}

const initGame = (rounds: number): HostGame => {
    const spectrums = pickSpectrums(rounds);
    return {
        spectrums,
        targets: spectrums.map(() => randomTarget()),
        round: 1,
        phase: 'clue',
        scores: {},
        reveal: null,
    };
};

function SintoniaGame({
    code,
    players,
    hostToken,
}: {
    code: number;
    players: LivePlayer[];
    hostToken: string;
}) {
    const totalRounds = players.length;
    const [game, setGame] = useState<HostGame>(() => initGame(totalRounds));
    const [dial, setDial] = useState(50);

    const psychic = players[(game.round - 1) % players.length];
    const spectrum = game.spectrums[game.round - 1];
    const target = game.targets[game.round - 1];

    const publicState = useMemo<SintoniaState>(
        () => ({
            phase: game.phase,
            round: game.round,
            totalRounds,
            spectrum,
            psychic,
            target: game.phase === 'reveal' ? target : undefined,
            dial: game.phase === 'reveal' ? game.reveal?.dial : undefined,
            points: game.phase === 'reveal' ? game.reveal?.points : undefined,
            scores:
                game.phase === 'reveal' || game.phase === 'final'
                    ? scoreboard(players, game.scores)
                    : undefined,
        }),
        [game, players, totalRounds, psychic, spectrum, target],
    );
    usePublishedState({ game: SINTONIA_ID, code, state: publicState, hostToken });
    // The psychic privately receives the target during clue/guess over the per-seat channel
    // (each round has its own slot); null outside clue/guess so it isn't re-published at reveal.
    usePublishedPrivate({
        game: SINTONIA_ID,
        code,
        round: game.round,
        seat: psychic.seat,
        value: game.phase === 'clue' || game.phase === 'guess' ? target : null,
        hostToken,
    });

    const toGuess = () => {
        setDial(50);
        setGame((g) => ({ ...g, phase: 'guess' }));
    };
    const toReveal = () =>
        setGame((g) => {
            const points = scoreGuess(target, dial);
            return {
                ...g,
                phase: 'reveal',
                reveal: { dial, points },
                scores: applyScore(g.scores, psychic.seat, points),
            };
        });
    const next = () =>
        setGame((g) =>
            g.round < totalRounds
                ? { ...g, round: g.round + 1, phase: 'clue', reveal: null }
                : { ...g, phase: 'final' },
        );
    const restart = () => {
        setDial(50);
        setGame(initGame(totalRounds));
    };

    const scores = scoreboard(players, game.scores);
    const champion = scores[0];

    return (
        <LiveBoard
            manifest={sintoniaManifest}
            accentChip={acc.chip}
            round={game.phase === 'final' ? null : game.round}
            totalRounds={totalRounds}
        >
            {game.phase === 'clue' && (
                <ClueStage psychic={psychic} spectrum={spectrum} onStart={toGuess} />
            )}
            {game.phase === 'guess' && (
                <GuessStage
                    psychic={psychic}
                    spectrum={spectrum}
                    dial={dial}
                    setDial={setDial}
                    onLock={toReveal}
                />
            )}
            {game.phase === 'reveal' && game.reveal && (
                <RevealStage
                    spectrum={spectrum}
                    target={target}
                    dial={game.reveal.dial}
                    points={game.reveal.points}
                    psychic={psychic}
                    scores={scores}
                    isLast={game.round >= totalRounds}
                    onNext={next}
                />
            )}
            {game.phase === 'final' && (
                <Podium
                    accent={acc}
                    label="En la misma onda"
                    caption={champion && `${champion.score} puntos`}
                    entries={scores.map(entry)}
                    onRestart={restart}
                />
            )}
        </LiveBoard>
    );
}

function ClueStage({
    psychic,
    spectrum,
    onStart,
}: {
    psychic: LivePlayer;
    spectrum: Spectrum;
    onStart: () => void;
}) {
    return (
        <div className="flex w-full flex-col items-center gap-6 short:gap-4">
            <Surface className="w-full p-6 text-center">
                <Eyebrow className={acc.text}>Da la pista</Eyebrow>
                <p className="mt-2 text-2xl font-extrabold text-white">
                    <span className={acc.text}>{psychic.name}</span> ve el objetivo secreto
                </p>
                <p className="mt-2 text-sm text-gray-400">
                    {psychic.name} mira su móvil y da UNA pista para situar el objetivo entre los
                    dos extremos. El resto, ¡a escuchar!
                </p>
            </Surface>
            <SpectrumBar spectrum={spectrum} />
            <Button
                variant="accent"
                accentClass={acc.solidButton}
                className="min-w-56"
                onPress={onStart}
            >
                Empezar a adivinar
            </Button>
        </div>
    );
}

function GuessStage({
    psychic,
    spectrum,
    dial,
    setDial,
    onLock,
}: {
    psychic: LivePlayer;
    spectrum: Spectrum;
    dial: number;
    setDial: (n: number) => void;
    onLock: () => void;
}) {
    return (
        <div className="flex w-full flex-col items-center gap-6 short:gap-4">
            <p className="text-center text-sm text-gray-400">
                Debatid y mové el dial hasta donde creéis que apunta la pista de{' '}
                <span className={ClassnameHelper.join('font-semibold', acc.text)}>
                    {psychic.name}
                </span>
            </p>
            <SpectrumBar spectrum={spectrum} dial={dial} />
            <RangeInput
                min={0}
                max={100}
                value={dial}
                onChange={(event) => setDial(Number(event.target.value))}
                aria-label="Dial"
                accentClass={acc.range}
            />
            <Button
                variant="accent"
                accentClass={acc.solidButton}
                className="min-w-56"
                onPress={onLock}
            >
                Bloquear respuesta
            </Button>
        </div>
    );
}

/**
 * The round's payoff: where the dial actually landed against the secret band, and what it was
 * worth. The score is the news, so it is staged like one — the points spring in inside the same
 * accent medallion the podium crowns its champion with, rather than being a `+4` in a sentence.
 * The bullseye keeps its confetti, but as a `round` spark: it fires every time somebody nails it,
 * and it must not spend the celebration the final podium is saving up for.
 */
function RevealStage({
    spectrum,
    target,
    dial,
    points,
    psychic,
    scores,
    isLast,
    onNext,
}: {
    spectrum: Spectrum;
    target: number;
    dial: number;
    points: number;
    psychic: LivePlayer;
    scores: Score[];
    isLast: boolean;
    onNext: () => void;
}) {
    const label = points === 4 ? '¡En el blanco!' : points > 0 ? '¡Muy cerca!' : '¡Uy, lejos!';
    return (
        <div className="flex w-full flex-col items-center gap-5 short:gap-4">
            {points === 4 && (
                <ConfettiBurst
                    key={`bull-${target}-${dial}`}
                    colors={acc.confetti}
                    intensity="round"
                />
            )}
            <SpectrumBar spectrum={spectrum} target={target} dial={dial} />

            <motion.div
                className="flex flex-col items-center gap-3 text-center short:gap-2"
                initial={{ opacity: 0, scale: 0.8, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 280, damping: 18, delay: 0.15 }}
            >
                <span
                    className={ClassnameHelper.join(
                        'flex h-16 w-16 items-center justify-center rounded-full text-2xl font-extrabold ring-1 ring-inset',
                        'short:h-14 short:w-14 short:text-xl',
                        acc.highlight,
                        acc.text,
                    )}
                >
                    +{points}
                </span>
                <div>
                    <p className="text-2xl font-extrabold text-white short:text-xl">{label}</p>
                    <p className="mt-1 text-sm text-gray-400">
                        {points === 1 ? '1 punto' : `${points} puntos`} para{' '}
                        <span className={ClassnameHelper.join('font-semibold', acc.text)}>
                            {psychic.name}
                        </span>
                    </p>
                </div>
            </motion.div>

            <ScoreChips entries={scores.map(entry)} accentChip={acc.chip} />
            <Button
                variant="accent"
                accentClass={acc.solidButton}
                className="min-w-56"
                onPress={onNext}
            >
                {isLast ? 'Ver clasificación final' : 'Siguiente ronda'}
            </Button>
        </div>
    );
}
