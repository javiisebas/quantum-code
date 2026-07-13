'use client';

import { LocalStorageHelper } from '@/platform/persistence/local-storage';
import { submitInput } from '@/platform/room/live-client';
import { useLiveState } from '@/platform/room/use-live-room';
import { Button } from '@/platform/ui/Button';
import { Eyebrow } from '@/platform/ui/Eyebrow';
import { Surface } from '@/platform/ui/Surface';
import { ClassnameHelper } from '@/platform/util/classnames';
import { Spinner } from '@heroui/react';
import { FormEvent, ReactNode, useEffect, useState } from 'react';
import { BiCheckCircle } from 'react-icons/bi';
import { accentOf } from '../_shared/accents';
import { LivePlayerShell } from '../_shared/live/LivePlayerShell';
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
        <LivePlayerShell game={CHISPAS_ID} gameName={chispasManifest.name} code={code}>
            {({ code: roomCode, seat, name }) => (
                <ChispasPhone code={roomCode} seat={seat} name={name} />
            )}
        </LivePlayerShell>
    );
}

function CenteredCard({ children }: { children: ReactNode }) {
    return (
        <main className="flex min-h-screen items-center justify-center px-6 py-10">
            <Surface as="section" className="w-full max-w-sm p-8 text-center">
                {children}
            </Surface>
        </main>
    );
}

function ChispasPhone({ code, seat, name }: { code: number; seat: number; name: string }) {
    const state = useLiveState<ChispasState>({ game: CHISPAS_ID, code });

    // Joined, but the host hasn't started (or advanced to) a published phase yet.
    if (!state) {
        return (
            <CenteredCard>
                <p className="text-lg font-semibold text-white">¡Estás dentro, {name}! ⚡</p>
                <p className="mt-2 text-sm text-gray-400">
                    Esperando a que el anfitrión empiece la partida…
                </p>
                <div className="mt-5 flex justify-center">
                    <Spinner color="secondary" />
                </div>
            </CenteredCard>
        );
    }

    // Joined after the host started — sit out until the next game.
    const inGame = state.players.some((p) => p.seat === seat);
    if (!inGame) {
        return (
            <CenteredCard>
                <p className="text-lg font-semibold text-white">Hola, {name} 👋</p>
                <p className="mt-2 text-sm text-gray-400">
                    La partida ya ha empezado. Entrarás cuando el anfitrión empiece una nueva.
                </p>
            </CenteredCard>
        );
    }

    switch (state.phase) {
        case 'answer':
            return <AnswerPhone code={code} seat={seat} state={state} />;
        case 'vote':
            return <VotePhone code={code} seat={seat} state={state} />;
        case 'reveal':
            return <RevealPhone seat={seat} state={state} />;
        case 'final':
            return <FinalPhone seat={seat} state={state} />;
    }
}

function AnswerPhone({ code, seat, state }: { code: number; seat: number; state: ChispasState }) {
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
        await submitInput(CHISPAS_ID, code, answerRound(state.gen, state.round), seat, {
            text: trimmed,
        }).catch(() => {});
    };

    if (sent) {
        return (
            <CenteredCard>
                <BiCheckCircle className={ClassnameHelper.join('mx-auto', acc.text)} size={44} />
                <p className="mt-3 text-lg font-semibold text-white">¡Respuesta enviada!</p>
                <p className="mt-2 text-sm text-gray-400">Espera a que voten los demás…</p>
                <p className="mt-4 rounded-xl bg-white/5 px-4 py-2 text-sm text-gray-300">
                    “{draft}”
                </p>
            </CenteredCard>
        );
    }

    return (
        <main className="flex min-h-screen flex-col justify-center px-6 py-10">
            <Eyebrow className="text-center">
                Ronda {state.round}/{state.totalRounds}
            </Eyebrow>
            <h1 className="mt-3 text-center text-xl font-extrabold text-white">{state.prompt}</h1>
            <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
                <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    maxLength={MAX_ANSWER}
                    autoFocus
                    rows={3}
                    placeholder="Escribe algo gracioso…"
                    aria-label="Tu respuesta"
                    className="w-full resize-none rounded-2xl bg-white/5 px-4 py-3 text-lg text-white ring-1 ring-inset ring-white/15 outline-none transition placeholder:text-gray-500 focus:ring-2 focus:ring-yellow-400"
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
        </main>
    );
}

function VotePhone({ code, seat, state }: { code: number; seat: number; state: ChispasState }) {
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
        await submitInput(CHISPAS_ID, code, voteRound(state.gen, state.round), seat, {
            choice: id,
        }).catch(() => {});
    };

    return (
        <main className="flex min-h-screen flex-col justify-center px-6 py-10">
            <Eyebrow className="text-center">Vota la más graciosa</Eyebrow>
            <p className="mt-2 text-center text-sm text-gray-400">{state.prompt}</p>

            <ul className="mt-6 flex flex-col gap-3">
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
                                    'w-full rounded-2xl px-4 py-4 text-left text-lg font-semibold ring-1 ring-inset transition',
                                    isChosen
                                        ? 'bg-yellow-500/20 text-yellow-100 ring-yellow-400/60'
                                        : 'bg-white/5 text-white ring-white/10',
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
                <p className="mt-5 text-center text-sm text-emerald-300">
                    ✓ Voto enviado. Mira la pantalla para los resultados.
                </p>
            )}
        </main>
    );
}

function RevealPhone({ seat, state }: { seat: number; state: ChispasState }) {
    const won = (state.winnerSeats ?? []).includes(seat);
    const me = (state.scores ?? []).find((s) => s.seat === seat);
    return (
        <CenteredCard>
            {won ? (
                <>
                    <span className="text-5xl" aria-hidden="true">
                        🎉
                    </span>
                    <p className="mt-3 text-2xl font-extrabold text-yellow-300">
                        ¡Ganaste la ronda!
                    </p>
                </>
            ) : (
                <p className="text-lg font-semibold text-white">Ronda terminada</p>
            )}
            <p className="mt-2 text-sm text-gray-400">Mira la pantalla principal 📺</p>
            {me && (
                <p className="mt-4 text-sm text-gray-300">
                    Llevas <span className={ClassnameHelper.join('font-bold', acc.text)}>{me.score}</span>{' '}
                    puntos
                </p>
            )}
        </CenteredCard>
    );
}

function FinalPhone({ seat, state }: { seat: number; state: ChispasState }) {
    const scores = state.scores ?? [];
    const rank = scores.findIndex((s) => s.seat === seat) + 1;
    const me = scores[rank - 1];
    const isChampion = rank === 1;
    return (
        <CenteredCard>
            <span className="text-5xl" aria-hidden="true">
                {isChampion ? '🏆' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '🎈'}
            </span>
            <p className="mt-3 text-2xl font-extrabold text-white">
                {isChampion ? '¡Has ganado!' : `Puesto ${rank || '—'}`}
            </p>
            {me && <p className="mt-1 text-sm text-gray-400">{me.score} puntos</p>}
            <p className="mt-4 text-sm text-gray-400">Mira la clasificación en la pantalla 📺</p>
        </CenteredCard>
    );
}
