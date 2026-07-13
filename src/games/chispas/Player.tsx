'use client';

import { LocalStorageHelper } from '@/platform/persistence/local-storage';
import { submitInput } from '@/platform/room/live-client';
import { useLiveState } from '@/platform/room/use-live-room';
import { Button } from '@/platform/ui/Button';
import { Chip } from '@/platform/ui/Chip';
import { ConfettiBurst } from '@/platform/ui/Confetti';
import { Eyebrow } from '@/platform/ui/Eyebrow';
import { RankCard } from '@/platform/ui/Podium';
import { Surface } from '@/platform/ui/Surface';
import { TextArea } from '@/platform/ui/TextInput';
import { ClassnameHelper } from '@/platform/util/classnames';
import { motion } from 'framer-motion';
import { FormEvent, useEffect, useState } from 'react';
import { BiCheckCircle } from 'react-icons/bi';
import { accentOf } from '../_shared/accents';
import { LivePlayerShell } from '../_shared/live/LivePlayerShell';
import { LateJoinCard, LiveWaiting, PhoneStage } from '../_shared/live/PhoneStage';
import { answerRound, AnswerView, ChispasState, voteRound } from './domain';
import { CHISPAS_ID, chispasManifest } from './manifest';

const acc = accentOf(chispasManifest.accent);
const MAX_ANSWER = 100;

const ansKey = (code: number, gen: number, round: number) =>
    `quantum:chispas:${code}:${gen}:ans:${round}`;
const voteKey = (code: number, gen: number, round: number) =>
    `quantum:chispas:${code}:${gen}:vote:${round}`;

/** Chispas phone: join + name, then render the live phase for this player. */
export function ChispasPlayer({ code }: { code: number | null }) {
    return (
        <LivePlayerShell game={CHISPAS_ID} code={code}>
            {({ code: roomCode, seat, name, seatToken }) => (
                <ChispasPhone code={roomCode} seat={seat} name={name} seatToken={seatToken} />
            )}
        </LivePlayerShell>
    );
}

function ChispasPhone({
    code,
    seat,
    name,
    seatToken,
}: {
    code: number;
    seat: number;
    name: string;
    seatToken: string;
}) {
    const state = useLiveState<ChispasState>({ game: CHISPAS_ID, code });

    // Joined, but the host hasn't started (or advanced to) a published phase yet.
    if (!state) {
        return <LiveWaiting name={name} emoji={chispasManifest.emoji} />;
    }

    // Joined after the host started — sit out until the next game.
    const inGame = state.players.some((player) => player.seat === seat);
    if (!inGame) {
        return <LateJoinCard name={name} />;
    }

    switch (state.phase) {
        case 'answer':
            return <AnswerPhone code={code} seat={seat} seatToken={seatToken} state={state} />;
        case 'vote':
            return <VotePhone code={code} seat={seat} seatToken={seatToken} state={state} />;
        case 'reveal':
            return <RevealPhone seat={seat} state={state} />;
        case 'final':
            return <FinalPhone seat={seat} state={state} />;
    }
}

function AnswerPhone({
    code,
    seat,
    seatToken,
    state,
}: {
    code: number;
    seat: number;
    seatToken: string;
    state: ChispasState;
}) {
    const [draft, setDraft] = useState('');
    const [sent, setSent] = useState(false);

    // Reset per round; restore a previously-sent answer if the phone reloaded.
    useEffect(() => {
        const prior = LocalStorageHelper.getLocalStorageItem<string>(
            ansKey(code, state.gen, state.round),
        );
        if (prior) {
            setDraft(prior);
            setSent(true);
        } else {
            setDraft('');
            setSent(false);
        }
    }, [code, state.gen, state.round]);

    const trimmed = draft.trim().slice(0, MAX_ANSWER);

    const submit = async (event: FormEvent) => {
        event.preventDefault();
        if (trimmed.length === 0 || sent) return;
        LocalStorageHelper.setLocalStorageItem(ansKey(code, state.gen, state.round), trimmed);
        setSent(true);
        await submitInput(
            CHISPAS_ID,
            code,
            answerRound(state.gen, state.round),
            seat,
            { text: trimmed },
            seatToken,
        ).catch(() => {});
    };

    if (sent) {
        return (
            <PhoneStage>
                <Surface as="section" className="w-full max-w-sm p-8">
                    <BiCheckCircle
                        className={ClassnameHelper.join('mx-auto', acc.text)}
                        size={44}
                    />
                    <p className="mt-3 text-lg font-semibold text-white">¡Respuesta enviada!</p>
                    <p className="mt-2 text-sm text-gray-400">Espera a que voten los demás…</p>
                    <Surface tone="inset" radius="xl" className="mt-4 px-4 py-2">
                        <p className="text-sm text-gray-300">“{draft}”</p>
                    </Surface>
                </Surface>
            </PhoneStage>
        );
    }

    return (
        <PhoneStage className="gap-4">
            <Eyebrow>
                Ronda {state.round}/{state.totalRounds}
            </Eyebrow>
            <h1 className="text-xl font-extrabold text-white">{state.prompt}</h1>
            <form onSubmit={submit} className="flex w-full flex-col gap-4">
                <TextArea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    maxLength={MAX_ANSWER}
                    autoFocus
                    rows={3}
                    align="left"
                    placeholder="Escribe algo gracioso…"
                    aria-label="Tu respuesta"
                />
                <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Sé breve y con chispa ⚡</span>
                    <span>
                        {trimmed.length}/{MAX_ANSWER}
                    </span>
                </div>
                <Button
                    type="submit"
                    variant="accent"
                    accentClass={acc.solidButton}
                    fullWidth
                    isDisabled={trimmed.length === 0}
                >
                    Enviar
                </Button>
            </form>
        </PhoneStage>
    );
}

function VotePhone({
    code,
    seat,
    seatToken,
    state,
}: {
    code: number;
    seat: number;
    seatToken: string;
    state: ChispasState;
}) {
    const answers: AnswerView[] = state.answers ?? [];
    const [votedId, setVotedId] = useState<number | null>(null);
    const [ownText, setOwnText] = useState<string | null>(null);

    useEffect(() => {
        setVotedId(
            LocalStorageHelper.getLocalStorageItem<number>(voteKey(code, state.gen, state.round)),
        );
        setOwnText(
            LocalStorageHelper.getLocalStorageItem<string>(ansKey(code, state.gen, state.round)),
        );
    }, [code, state.gen, state.round]);

    const castVote = async (id: number) => {
        if (votedId !== null) return;
        LocalStorageHelper.setLocalStorageItem(voteKey(code, state.gen, state.round), id);
        setVotedId(id);
        await submitInput(
            CHISPAS_ID,
            code,
            voteRound(state.gen, state.round),
            seat,
            { choice: id },
            seatToken,
        ).catch(() => {});
    };

    return (
        <PhoneStage className="gap-4">
            <div className="shrink-0">
                <Eyebrow>Vota la más graciosa</Eyebrow>
                <p className="mt-2 text-sm text-gray-400">{state.prompt}</p>
            </div>

            <ul className="flex w-full flex-col gap-3">
                {answers.map((answer) => {
                    const isOwn = ownText !== null && answer.text === ownText;
                    const isChosen = votedId === answer.id;
                    const locked = votedId !== null;
                    return (
                        <li key={answer.id}>
                            <button
                                type="button"
                                disabled={isOwn || locked}
                                onClick={() => castVote(answer.id)}
                                className={ClassnameHelper.join(
                                    'w-full rounded-2xl px-4 py-4 text-left text-lg font-semibold text-white ring-1 ring-inset transition',
                                    isChosen ? acc.highlight : 'bg-white/5 ring-white/10',
                                    isOwn && 'opacity-40',
                                    !locked && !isOwn && 'active:scale-[0.99] hover:bg-white/10',
                                    locked && !isChosen && 'opacity-60',
                                )}
                            >
                                {answer.text}
                                {isOwn && (
                                    <span className="ml-2 text-xs font-normal text-gray-400">
                                        (la tuya)
                                    </span>
                                )}
                            </button>
                        </li>
                    );
                })}
            </ul>

            {votedId !== null && (
                <p className="shrink-0 text-sm text-emerald-300">
                    ✓ Voto enviado. Mira la pantalla para los resultados.
                </p>
            )}
        </PhoneStage>
    );
}

/**
 * The round's result on my phone. Built from the same parts as `RankCard` (medallion + score
 * badge), so the round card and the final card are recognisably the same object — and winning a
 * round gets its own small celebration on the phone of the one person who probably isn't looking
 * at the TV right then.
 */
function RevealPhone({ seat, state }: { seat: number; state: ChispasState }) {
    const won = (state.winnerSeats ?? []).includes(seat);
    const me = (state.scores ?? []).find((score) => score.seat === seat);
    return (
        <PhoneStage>
            {won && <ConfettiBurst colors={acc.confetti} intensity="round" />}
            <motion.div
                className="w-full max-w-sm"
                initial={{ opacity: 0, scale: 0.92, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 240, damping: 20 }}
            >
                <Surface
                    as="section"
                    className="flex flex-col items-center gap-4 p-8 text-center short:gap-3 short:p-6"
                >
                    <span
                        aria-hidden="true"
                        className={ClassnameHelper.join(
                            'flex h-20 w-20 items-center justify-center rounded-full text-4xl ring-1 ring-inset',
                            won ? acc.highlight : 'bg-white/5 ring-white/10',
                        )}
                    >
                        {won ? '🏆' : '⚡'}
                    </span>
                    <p
                        className={ClassnameHelper.join(
                            'text-2xl font-extrabold',
                            won ? acc.text : 'text-white',
                        )}
                    >
                        {won ? '¡Ganaste la ronda!' : 'Ronda terminada'}
                    </p>
                    {me && <Chip className={won ? acc.chip : undefined}>{me.score} puntos</Chip>}
                    <p className="text-sm text-gray-400">Mira la pantalla principal 📺</p>
                </Surface>
            </motion.div>
        </PhoneStage>
    );
}

function FinalPhone({ seat, state }: { seat: number; state: ChispasState }) {
    const scores = state.scores ?? [];
    const rank = scores.findIndex((score) => score.seat === seat) + 1;
    const me = scores[rank - 1];
    return (
        <PhoneStage>
            <RankCard
                rank={rank}
                fallbackEmoji="🎈"
                accent={acc}
                caption={me && `${me.score} puntos`}
            />
        </PhoneStage>
    );
}
