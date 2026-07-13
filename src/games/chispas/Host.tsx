'use client';

import { usePublishedState, useLiveInputs } from '@/platform/room/use-live-room';
import { Button } from '@/platform/ui/Button';
import { Chip } from '@/platform/ui/Chip';
import { ConfettiBurst } from '@/platform/ui/Confetti';
import { Eyebrow } from '@/platform/ui/Eyebrow';
import { Podium, PodiumEntry, ScoreChips } from '@/platform/ui/Podium';
import { Surface } from '@/platform/ui/Surface';
import { ClassnameHelper } from '@/platform/util/classnames';
import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { BiCheck, BiSolidStar } from 'react-icons/bi';
import { accentOf } from '../_shared/accents';
import { LiveBoard } from '../_shared/live/LiveBoard';
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
    Score,
    scoreboard,
    TOTAL_ROUNDS,
    tallyVotes,
    voteRound,
} from './domain';
import { CHISPAS_ID, chispasManifest } from './manifest';

const acc = accentOf(chispasManifest.accent);

/** A points tally as a ranked row. The unit rides along so `1200` reads as `1200 pts` at a glance. */
const entry = (score: Score): PodiumEntry => ({
    id: score.seat,
    name: score.name,
    score: score.score,
    unit: 'pts',
});

/** Chispas host: gather players in the shared lobby, then drive the live game. */
export function ChispasHost() {
    return (
        <LiveLobby
            game={CHISPAS_ID}
            minPlayers={chispasManifest.minPlayers}
            maxPlayers={chispasManifest.maxPlayers}
        >
            {({ code, players, hostToken }) => (
                <ChispasGame code={code} players={players} hostToken={hostToken} />
            )}
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

function ChispasGame({
    code,
    players,
    hostToken,
}: {
    code: number;
    players: LivePlayer[];
    hostToken: string;
}) {
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
    usePublishedState({ game: CHISPAS_ID, code, state: publicState, hostToken });

    // Poll the relevant input bucket for the current phase.
    const answerInputs = useLiveInputs<{ text?: string }>({
        game: CHISPAS_ID,
        code,
        round: answerRound(gen, game.round),
        active: game.phase === 'answer',
        hostToken,
    });
    const voteInputs = useLiveInputs<{ choice?: number }>({
        game: CHISPAS_ID,
        code,
        round: voteRound(gen, game.round),
        active: game.phase === 'vote',
        hostToken,
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
                ? {
                      ...g,
                      round: g.round + 1,
                      phase: 'answer',
                      answers: [],
                      reveal: [],
                      winnerSeats: [],
                  }
                : { ...g, phase: 'final' },
        );

    const restart = () => {
        setGen((g) => g + 1);
        setGame(initGame());
    };

    const scores = scoreboard(players, game.scores);
    const champion = scores[0];

    return (
        <LiveBoard
            manifest={chispasManifest}
            accentChip={acc.chip}
            round={game.phase === 'final' ? null : game.round}
            totalRounds={TOTAL_ROUNDS}
        >
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
                    scores={scores}
                    isLast={game.round >= TOTAL_ROUNDS}
                    onNext={next}
                />
            )}
            {game.phase === 'final' && (
                <Podium
                    accent={acc}
                    label="Ganador"
                    caption={champion && `${champion.score} puntos`}
                    entries={scores.map(entry)}
                    onRestart={restart}
                />
            )}
        </LiveBoard>
    );
}

// ---------------------------------------------------------------------------
// Shared chrome
// ---------------------------------------------------------------------------

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
        <div className="flex w-full flex-col items-center gap-6 short:gap-4">
            <PromptCard prompt={prompt} />
            <p className="text-sm text-gray-400">✍️ Escribid vuestra respuesta en el móvil</p>

            <ul className="flex flex-wrap justify-center gap-2">
                {players.map((player) => {
                    const done = answeredSeats.has(player.seat);
                    return (
                        <li key={player.seat}>
                            <Chip
                                className={
                                    done
                                        ? 'bg-emerald-400/15 text-emerald-200 ring-1 ring-inset ring-emerald-400/20'
                                        : undefined
                                }
                            >
                                {done && <BiCheck size={16} />}
                                {player.name}
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
        // The answer list is the one thing here that can outgrow the screen (a full room of 12),
        // so it is the only thing that scrolls: the prompt and the CTA stay put.
        <div className="flex min-h-0 w-full flex-1 flex-col items-center gap-5">
            <div className="flex w-full shrink-0 flex-col items-center gap-5">
                <PromptCard prompt={prompt} size="sm" />
                <Eyebrow className={acc.text}>Votad la más graciosa en vuestro móvil</Eyebrow>
            </div>

            <ul className="flex min-h-0 w-full flex-1 flex-col gap-3 overflow-y-auto [justify-content:safe_center]">
                {answers.map((answer, index) => (
                    <li key={answer.id} className="shrink-0">
                        <Surface tone="inset" radius="2xl" className="flex items-center gap-3 p-4">
                            <span
                                className={ClassnameHelper.join(
                                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                                    acc.chip,
                                )}
                            >
                                {index + 1}
                            </span>
                            <span className="text-left text-lg font-semibold text-white">
                                {answer.text}
                            </span>
                        </Surface>
                    </li>
                ))}
            </ul>

            <div className="flex shrink-0 flex-col items-center gap-2">
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

/**
 * The round's payoff: who wrote what, and who was funniest. The list already cascaded; what it
 * lacked was a WINNER you could spot without reading — the tint alone made you hunt for the
 * accent row. So the winning answer(s) now carry the 🏆 in the rank slot every other row leaves
 * empty, which is the same "medal in a column" language the podium uses two minutes later. The
 * confetti is a `round` spark, not the final's full burst: it fires every round, and the podium
 * has to stay the loudest thing in the game.
 */
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
    scores: Score[];
    isLast: boolean;
    onNext: () => void;
}) {
    const winners = new Set(winnerSeats);
    // Nobody voted → there is no "most voted", so neither the trophy column nor the headline
    // may claim one (`roundWinners` returns [] when the top answer has zero votes).
    const hasWinner = winnerSeats.length > 0;
    return (
        <div className="flex min-h-0 w-full flex-1 flex-col items-center gap-5">
            {hasWinner && (
                <ConfettiBurst key={`reveal-${round}`} colors={acc.confetti} intensity="round" />
            )}
            <Eyebrow className={ClassnameHelper.join('shrink-0', acc.text)}>
                {hasWinner ? 'La más votada' : 'Resultados'}
            </Eyebrow>

            <ul className="flex min-h-0 w-full flex-1 flex-col gap-3 overflow-y-auto [justify-content:safe_center]">
                {reveal.map((answer, index) => {
                    const won = winners.has(answer.seat);
                    return (
                        <motion.li
                            key={answer.id}
                            className="shrink-0"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            // Capped, so a full room of 12 answers still finishes in ~1s.
                            transition={{ delay: Math.min(index, 7) * 0.1, duration: 0.3 }}
                        >
                            <Surface
                                tone={won ? 'plain' : 'inset'}
                                radius="2xl"
                                className={ClassnameHelper.join(
                                    'flex items-center gap-3 p-4',
                                    won && acc.highlight,
                                )}
                            >
                                {hasWinner && (
                                    <span
                                        aria-hidden="true"
                                        className="flex w-7 shrink-0 justify-center text-2xl"
                                    >
                                        {won ? '🏆' : ''}
                                    </span>
                                )}
                                <div className="flex flex-1 flex-col text-left">
                                    <span
                                        className={ClassnameHelper.join(
                                            'font-semibold text-white',
                                            won ? 'text-xl' : 'text-lg',
                                        )}
                                    >
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
                                    <BiSolidStar
                                        size={14}
                                        className={won ? undefined : 'opacity-50'}
                                    />
                                    {answer.votes} {answer.votes === 1 ? 'voto' : 'votos'}
                                </Chip>
                            </Surface>
                        </motion.li>
                    );
                })}
            </ul>

            <ScoreChips entries={scores.map(entry)} accentChip={acc.chip} />

            <Button
                variant="accent"
                accentClass={acc.solidButton}
                className="min-w-56 shrink-0"
                onPress={onNext}
            >
                {isLast ? 'Ver clasificación final' : 'Siguiente ronda'}
            </Button>
        </div>
    );
}
