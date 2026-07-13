'use client';

import { usePublishedPrivate, usePublishedState } from '@/platform/room/use-live-room';
import { Button } from '@/platform/ui/Button';
import { Chip } from '@/platform/ui/Chip';
import { Eyebrow } from '@/platform/ui/Eyebrow';
import { Surface } from '@/platform/ui/Surface';
import { ClassnameHelper } from '@/platform/util/classnames';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import Confetti from 'react-confetti';
import { BiHome } from 'react-icons/bi';
import { accentOf } from '../_shared/accents';
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

/** Sintonía host: gather players in the lobby, then drive the spectrum game. */
export function SintoniaHost() {
    return (
        <LiveLobby
            game={SINTONIA_ID}
            gameName={sintoniaManifest.name}
            emoji={sintoniaManifest.emoji}
            accent={sintoniaManifest.accent}
            minPlayers={sintoniaManifest.minPlayers}
            maxPlayers={sintoniaManifest.maxPlayers}
            hint="Por turnos, uno ve el objetivo y da una pista; el resto mueve el dial."
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
            g.round < totalRounds ? { ...g, round: g.round + 1, phase: 'clue', reveal: null } : { ...g, phase: 'final' },
        );
    const restart = () => {
        setDial(50);
        setGame(initGame(totalRounds));
    };

    return (
        <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-5 py-8">
            <header className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-2xl" aria-hidden="true">
                        {sintoniaManifest.emoji}
                    </span>
                    <span className="text-lg font-bold text-white">{sintoniaManifest.name}</span>
                </div>
                {game.phase !== 'final' && (
                    <Chip className={acc.chip}>
                        Ronda {game.round}/{totalRounds}
                    </Chip>
                )}
            </header>

            <div className="flex flex-1 flex-col justify-center py-6">
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
                        scores={scoreboard(players, game.scores)}
                        isLast={game.round >= totalRounds}
                        onNext={next}
                    />
                )}
                {game.phase === 'final' && (
                    <FinalStage scores={scoreboard(players, game.scores)} onRestart={restart} />
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
                numberOfPieces={240}
                gravity={0.25}
                colors={['#06b6d4', '#22d3ee', '#67e8f9', '#a5f3fc', '#ffffff']}
            />
        </div>
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
        <div className="flex flex-col items-center gap-6">
            <Surface className="w-full p-6 text-center">
                <Eyebrow className={acc.text}>Da la pista</Eyebrow>
                <p className="mt-2 text-2xl font-extrabold text-white">
                    <span className={acc.text}>{psychic.name}</span> ve el objetivo secreto
                </p>
                <p className="mt-2 text-sm text-gray-400">
                    {psychic.name} mira su móvil y da UNA pista para situar el objetivo entre los dos
                    extremos. El resto, ¡a escuchar!
                </p>
            </Surface>
            <SpectrumBar spectrum={spectrum} />
            <Button variant="accent" accentClass={acc.solidButton} className="min-w-56" onPress={onStart}>
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
        <div className="flex flex-col items-center gap-6">
            <p className="text-center text-sm text-gray-400">
                Debatid y mové el dial hasta donde creéis que apunta la pista de{' '}
                <span className={ClassnameHelper.join('font-semibold', acc.text)}>{psychic.name}</span>
            </p>
            <SpectrumBar spectrum={spectrum} dial={dial} />
            <input
                type="range"
                min={0}
                max={100}
                value={dial}
                onChange={(e) => setDial(Number(e.target.value))}
                aria-label="Dial"
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-cyan-400"
            />
            <Button variant="accent" accentClass={acc.solidButton} className="min-w-56" onPress={onLock}>
                Bloquear respuesta
            </Button>
        </div>
    );
}

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
        <div className="flex flex-col items-center gap-5">
            {points === 4 && <ConfettiBurst key={`bull-${target}-${dial}`} />}
            <SpectrumBar spectrum={spectrum} target={target} dial={dial} />
            <div className="text-center">
                <p className="text-2xl font-extrabold text-white">{label}</p>
                <p className={ClassnameHelper.join('mt-1 text-lg font-bold', acc.text)}>
                    +{points} {points === 1 ? 'punto' : 'puntos'} para {psychic.name}
                </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
                {scores.map((s, i) => (
                    <Chip key={s.seat} className={i === 0 ? acc.chip : undefined}>
                        <span className="font-semibold">{s.name}</span>
                        <span className="text-gray-400">·</span>
                        <span>{s.score}</span>
                    </Chip>
                ))}
            </div>
            <Button variant="accent" accentClass={acc.solidButton} className="min-w-56" onPress={onNext}>
                {isLast ? 'Ver clasificación final' : 'Siguiente ronda'}
            </Button>
        </div>
    );
}

function FinalStage({ scores, onRestart }: { scores: Score[]; onRestart: () => void }) {
    const champion = scores[0];
    return (
        <div className="flex flex-col items-center gap-6 text-center">
            <ConfettiBurst key="final" />
            <div>
                <span className="text-6xl" aria-hidden="true">
                    🏆
                </span>
                <Eyebrow className="mt-3">En la misma onda</Eyebrow>
                <h1 className="mt-1 text-4xl font-extrabold text-cyan-300">{champion?.name ?? '—'}</h1>
                {champion && <p className="mt-1 text-sm text-gray-400">{champion.score} puntos</p>}
            </div>
            <ol className="flex w-full max-w-sm flex-col gap-2">
                {scores.map((s, i) => (
                    <li key={s.seat}>
                        <Surface
                            tone={i === 0 ? 'plain' : 'inset'}
                            radius="2xl"
                            className={ClassnameHelper.join(
                                'flex items-center gap-3 p-3',
                                i === 0 && 'bg-cyan-500/15 ring-1 ring-inset ring-cyan-400/40',
                            )}
                        >
                            <span className="w-6 text-center font-mono text-lg font-bold text-gray-400">
                                {i + 1}
                            </span>
                            <span className="flex-1 text-left font-semibold text-white">{s.name}</span>
                            <span className={ClassnameHelper.join('font-bold', acc.text)}>{s.score}</span>
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
