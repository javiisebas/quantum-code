'use client';

import { usePublishedState, useLiveInputs } from '@/platform/room/use-live-room';
import { Button } from '@/platform/ui/Button';
import { Chip } from '@/platform/ui/Chip';
import { Eyebrow } from '@/platform/ui/Eyebrow';
import { Surface } from '@/platform/ui/Surface';
import { ClassnameHelper } from '@/platform/util/classnames';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import Confetti from 'react-confetti';
import { BiCheck, BiHome, BiSolidStar } from 'react-icons/bi';
import { accentOf } from '../_shared/accents';
import { LiveLobby } from '../_shared/live/LiveLobby';
import type { LivePlayer } from '../_shared/live/live-session';
import {
    answerRound,
    applyRoundScores,
    buildAnswers,
    ChispasAnswer,
    ChispasPhase,
    ChispasState,
    pickPrompts,
    RevealAnswer,
    revealAnswers,
    roundWinners,
    scoreboard,
    TOTAL_ROUNDS,
    tallyVotes,
    voteRound,
} from './domain';
import { CHISPAS_ID, chispasManifest } from './manifest';

const acc = accentOf(chispasManifest.accent);

/** Chispas host: gather players in the shared lobby, then drive the live game. */
export function ChispasHost() {
    return (
        <LiveLobby
            game={CHISPAS_ID}
            gameName={chispasManifest.name}
            emoji={chispasManifest.emoji}
            accent={chispasManifest.accent}
            minPlayers={chispasManifest.minPlayers}
            maxPlayers={chispasManifest.maxPlayers}
            hint="Cada uno responde en su móvil y luego votáis al más gracioso."
        >
            {({ code, players }) => <ChispasGame code={code} players={players} />}
        </LiveLobby>
    );
}

// ---------------------------------------------------------------------------
// Host-authoritative game state (the full state, incl. authorship; only a public
// projection is published to phones — authors stay hidden until the reveal).
// ---------------------------------------------------------------------------

interface HostGame {
    prompts: string[];
    round: number;
    phase: ChispasPhase;
    scores: Record<number, number>;
    answers: ChispasAnswer[];
    reveal: RevealAnswer[];
    winnerSeats: number[];
}

const initGame = (): HostGame => ({
    prompts: pickPrompts(TOTAL_ROUNDS),
    round: 1,
    phase: 'answer',
    scores: {},
    answers: [],
    reveal: [],
    winnerSeats: [],
});

function ChispasGame({ code, players }: { code: number; players: LivePlayer[] }) {
    const [game, setGame] = useState<HostGame>(initGame);
    // Per-game generation: bumped by "Jugar otra vez" so a replay in the SAME room never
    // reads the previous game's answers/votes (round numbers repeat across replays).
    const [gen, setGen] = useState(0);

    // Publish only a public projection — during 'vote' answers are anonymized. Memoized so
    // it changes (and re-publishes) only on real transitions, not on every input poll.
    const publicState = useMemo<ChispasState>(
        () => ({
            phase: game.phase,
            gen,
            round: game.round,
            totalRounds: TOTAL_ROUNDS,
            prompt: game.prompts[game.round - 1] ?? '',
            players,
            answers:
                game.phase === 'vote'
                    ? game.answers.map((a) => ({ id: a.id, text: a.text }))
                    : undefined,
            reveal: game.phase === 'reveal' ? game.reveal : undefined,
            winnerSeats: game.phase === 'reveal' ? game.winnerSeats : undefined,
            scores:
                game.phase === 'reveal' || game.phase === 'final'
                    ? scoreboard(players, game.scores)
                    : undefined,
        }),
        [game, players, gen],
    );
    usePublishedState({ game: CHISPAS_ID, code, state: publicState });

    // Poll the relevant input bucket for the current phase.
    const answerInputs = useLiveInputs<{ text?: string }>({
        game: CHISPAS_ID,
        code,
        round: answerRound(gen, game.round),
        active: game.phase === 'answer',
    });
    const voteInputs = useLiveInputs<{ choice?: number }>({
        game: CHISPAS_ID,
        code,
        round: voteRound(gen, game.round),
        active: game.phase === 'vote',
    });

    const answered = players.filter((p) => (answerInputs[p.seat]?.text ?? '').trim().length > 0);
    const voted = players.filter((p) => voteInputs[p.seat]?.choice !== undefined);

    const toVote = () =>
        setGame((g) => ({ ...g, phase: 'vote', answers: buildAnswers(players, answerInputs) }));

    const toReveal = () =>
        setGame((g) => {
            const counts = tallyVotes(g.answers, voteInputs);
            const reveal = revealAnswers(g.answers, counts);
            return {
                ...g,
                phase: 'reveal',
                reveal,
                winnerSeats: roundWinners(reveal),
                scores: applyRoundScores(g.scores, reveal),
            };
        });

    const next = () =>
        setGame((g) =>
            g.round < TOTAL_ROUNDS
                ? { ...g, round: g.round + 1, phase: 'answer', answers: [], reveal: [], winnerSeats: [] }
                : { ...g, phase: 'final' },
        );

    const restart = () => {
        setGen((g) => g + 1);
        setGame(initGame());
    };

    return (
        <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-5 py-8">
            <HostHeader round={game.round} phase={game.phase} />

            <div className="flex flex-1 flex-col justify-center py-6">
                {game.phase === 'answer' && (
                    <AnswerStage
                        prompt={game.prompts[game.round - 1] ?? ''}
                        answered={answered}
                        players={players}
                        onContinue={toVote}
                    />
                )}
                {game.phase === 'vote' && (
                    <VoteStage
                        prompt={game.prompts[game.round - 1] ?? ''}
                        answers={game.answers}
                        votedCount={voted.length}
                        total={players.length}
                        onContinue={toReveal}
                    />
                )}
                {game.phase === 'reveal' && (
                    <RevealStage
                        round={game.round}
                        reveal={game.reveal}
                        winnerSeats={game.winnerSeats}
                        scores={scoreboard(players, game.scores)}
                        isLast={game.round >= TOTAL_ROUNDS}
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

// ---------------------------------------------------------------------------
// Shared chrome
// ---------------------------------------------------------------------------

function HostHeader({ round, phase }: { round: number; phase: ChispasPhase }) {
    return (
        <header className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <span className="text-2xl" aria-hidden="true">
                    {chispasManifest.emoji}
                </span>
                <span className="text-lg font-bold text-white">{chispasManifest.name}</span>
            </div>
            {phase !== 'final' && (
                <Chip className={acc.chip}>
                    Ronda {round}/{TOTAL_ROUNDS}
                </Chip>
            )}
        </header>
    );
}

/** Full-screen one-shot confetti burst, re-keyed so it fires again each round. */
function ConfettiBurst() {
    return (
        <div className="pointer-events-none fixed inset-0 z-50">
            <Confetti
                recycle={false}
                numberOfPieces={280}
                gravity={0.25}
                colors={['#eab308', '#facc15', '#fde047', '#fef08a', '#ffffff']}
            />
        </div>
    );
}

const PromptCard = ({ prompt, size = 'lg' }: { prompt: string; size?: 'lg' | 'sm' }) => (
    <Surface className={ClassnameHelper.join('w-full p-6 text-center', size === 'lg' && 'py-8')}>
        <Eyebrow className={acc.text}>El reto</Eyebrow>
        <p
            className={ClassnameHelper.join(
                'mt-2 font-extrabold text-white',
                size === 'lg' ? 'text-2xl sm:text-3xl' : 'text-lg',
            )}
        >
            {prompt}
        </p>
    </Surface>
);

// ---------------------------------------------------------------------------
// Phase stages
// ---------------------------------------------------------------------------

function AnswerStage({
    prompt,
    answered,
    players,
    onContinue,
}: {
    prompt: string;
    answered: LivePlayer[];
    players: LivePlayer[];
    onContinue: () => void;
}) {
    const answeredSeats = new Set(answered.map((p) => p.seat));
    const allIn = answered.length === players.length && players.length > 0;

    return (
        <div className="flex flex-col items-center gap-6">
            <PromptCard prompt={prompt} />
            <p className="text-sm text-gray-400">✍️ Escribid vuestra respuesta en el móvil</p>

            <ul className="flex flex-wrap justify-center gap-2">
                {players.map((p) => {
                    const done = answeredSeats.has(p.seat);
                    return (
                        <li key={p.seat}>
                            <Chip
                                className={
                                    done
                                        ? 'bg-emerald-400/15 text-emerald-200 ring-1 ring-inset ring-emerald-400/20'
                                        : undefined
                                }
                            >
                                {done && <BiCheck size={16} />}
                                {p.name}
                            </Chip>
                        </li>
                    );
                })}
            </ul>

            <div className="flex flex-col items-center gap-2">
                <Button
                    variant="accent"
                    accentClass={acc.solidButton}
                    className="min-w-56"
                    onPress={onContinue}
                    isDisabled={answered.length < 2}
                >
                    {allIn ? '¡Todos listos! Ver respuestas' : 'Ver respuestas'}
                </Button>
                <span className="text-xs text-gray-500">
                    {answered.length}/{players.length} han respondido
                </span>
            </div>
        </div>
    );
}

function VoteStage({
    prompt,
    answers,
    votedCount,
    total,
    onContinue,
}: {
    prompt: string;
    answers: { id: number; text: string }[];
    votedCount: number;
    total: number;
    onContinue: () => void;
}) {
    const allIn = votedCount >= total && total > 0;
    return (
        <div className="flex flex-col items-center gap-5">
            <PromptCard prompt={prompt} size="sm" />
            <Eyebrow className={acc.text}>Votad la más graciosa en vuestro móvil</Eyebrow>

            <ul className="flex w-full flex-col gap-3">
                {answers.map((answer, i) => (
                    <li key={answer.id}>
                        <Surface tone="inset" radius="2xl" className="flex items-center gap-3 p-4">
                            <span
                                className={ClassnameHelper.join(
                                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                                    acc.chip,
                                )}
                            >
                                {i + 1}
                            </span>
                            <span className="text-left text-lg font-semibold text-white">
                                {answer.text}
                            </span>
                        </Surface>
                    </li>
                ))}
            </ul>

            <div className="flex flex-col items-center gap-2">
                <Button
                    variant="accent"
                    accentClass={acc.solidButton}
                    className="min-w-56"
                    onPress={onContinue}
                >
                    {allIn ? '¡Todos han votado! Resultados' : 'Ver resultados'}
                </Button>
                <span className="text-xs text-gray-500">
                    {votedCount}/{total} han votado
                </span>
            </div>
        </div>
    );
}

function RevealStage({
    round,
    reveal,
    winnerSeats,
    scores,
    isLast,
    onNext,
}: {
    round: number;
    reveal: RevealAnswer[];
    winnerSeats: number[];
    scores: { seat: number; name: string; score: number }[];
    isLast: boolean;
    onNext: () => void;
}) {
    const winners = new Set(winnerSeats);
    return (
        <div className="flex flex-col items-center gap-5">
            {winnerSeats.length > 0 && <ConfettiBurst key={`reveal-${round}`} />}
            <Eyebrow className={acc.text}>Resultados</Eyebrow>

            <ul className="flex w-full flex-col gap-3">
                {reveal.map((answer, i) => {
                    const won = winners.has(answer.seat);
                    return (
                        <motion.li
                            key={answer.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.12 }}
                        >
                            <Surface
                                tone={won ? 'plain' : 'inset'}
                                radius="2xl"
                                className={ClassnameHelper.join(
                                    'flex items-center gap-3 p-4',
                                    won && 'bg-yellow-500/15 ring-1 ring-inset ring-yellow-400/40',
                                )}
                            >
                                <div className="flex flex-1 flex-col text-left">
                                    <span className="text-lg font-semibold text-white">
                                        {answer.text}
                                    </span>
                                    <span
                                        className={ClassnameHelper.join(
                                            'text-sm',
                                            won ? acc.text : 'text-gray-400',
                                        )}
                                    >
                                        {answer.name}
                                    </span>
                                </div>
                                <Chip className={won ? acc.chip : undefined}>
                                    <BiSolidStar size={14} className={won ? undefined : 'opacity-50'} />
                                    {answer.votes} {answer.votes === 1 ? 'voto' : 'votos'}
                                </Chip>
                            </Surface>
                        </motion.li>
                    );
                })}
            </ul>

            <MiniScoreboard scores={scores} />

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

function FinalStage({
    scores,
    onRestart,
}: {
    scores: { seat: number; name: string; score: number }[];
    onRestart: () => void;
}) {
    const champion = scores[0];
    return (
        <div className="flex flex-col items-center gap-6 text-center">
            <ConfettiBurst key="final" />
            <div>
                <span className="text-6xl" aria-hidden="true">
                    🏆
                </span>
                <Eyebrow className="mt-3">Ganador</Eyebrow>
                <h1 className="mt-1 text-4xl font-extrabold text-yellow-300">
                    {champion?.name ?? '—'}
                </h1>
                {champion && (
                    <p className="mt-1 text-sm text-gray-400">{champion.score} puntos</p>
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
                                i === 0 && 'bg-yellow-500/15 ring-1 ring-inset ring-yellow-400/40',
                            )}
                        >
                            <span className="w-6 text-center font-mono text-lg font-bold text-gray-400">
                                {i + 1}
                            </span>
                            <span className="flex-1 text-left font-semibold text-white">{s.name}</span>
                            <span className={ClassnameHelper.join('font-bold', acc.text)}>
                                {s.score}
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

function MiniScoreboard({ scores }: { scores: { seat: number; name: string; score: number }[] }) {
    return (
        <div className="flex flex-wrap justify-center gap-2">
            {scores.map((s, i) => (
                <Chip key={s.seat} className={i === 0 ? acc.chip : undefined}>
                    <span className="font-semibold">{s.name}</span>
                    <span className="text-gray-400">·</span>
                    <span>{s.score}</span>
                </Chip>
            ))}
        </div>
    );
}
