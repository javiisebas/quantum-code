'use client';

import { useLiveState, usePrivateState } from '@/platform/room/use-live-room';
import { Eyebrow } from '@/platform/ui/Eyebrow';
import { Surface } from '@/platform/ui/Surface';
import { ClassnameHelper } from '@/platform/util/classnames';
import { Spinner } from '@heroui/react';
import { ReactNode } from 'react';
import { accentOf } from '../_shared/accents';
import { LivePlayerShell } from '../_shared/live/LivePlayerShell';
import { SpectrumBar } from './SpectrumBar';
import type { SintoniaState } from './domain';
import { SINTONIA_ID, sintoniaManifest } from './manifest';

const acc = accentOf(sintoniaManifest.accent);

/** Sintonía phone: join + name, then show this player's live view of the round. */
export function SintoniaPlayer({ code }: { code: number | null }) {
    return (
        <LivePlayerShell game={SINTONIA_ID} gameName={sintoniaManifest.name} code={code}>
            {({ code: roomCode, seat, name, seatToken }) => (
                <SintoniaPhone code={roomCode} seat={seat} name={name} seatToken={seatToken} />
            )}
        </LivePlayerShell>
    );
}

function Card({ children }: { children: ReactNode }) {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 py-10 text-center">
            {children}
        </main>
    );
}

function SintoniaPhone({
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
    const state = useLiveState<SintoniaState>({ game: SINTONIA_ID, code });
    // The psychic's secret target arrives over the per-seat private channel (never in public
    // state before reveal). Called unconditionally, gated by `active` so only the psychic phone
    // polls mid-round; `state` can be null on first render, hence the guards.
    const privateTarget = usePrivateState<number>({
        game: SINTONIA_ID,
        code,
        round: state?.round ?? 0,
        seat,
        seatToken,
        active:
            !!state &&
            state.psychic.seat === seat &&
            (state.phase === 'clue' || state.phase === 'guess'),
    });

    if (!state) {
        return (
            <Card>
                <Surface className="w-full max-w-sm p-8">
                    <p className="text-lg font-semibold text-white">¡Estás dentro, {name}! 📡</p>
                    <p className="mt-2 text-sm text-gray-400">
                        Esperando a que el anfitrión empiece la partida…
                    </p>
                    <div className="mt-5 flex justify-center">
                        <Spinner color="secondary" />
                    </div>
                </Surface>
            </Card>
        );
    }

    // A late joiner simply plays as a (non-psychic) guesser; no roster gating needed.
    const isPsychic = state.psychic.seat === seat;

    if (state.phase === 'final') {
        return <FinalPhone seat={seat} state={state} />;
    }

    if (state.phase === 'reveal') {
        const me = (state.scores ?? []).find((s) => s.seat === seat);
        return (
            <Card>
                <div className="w-full max-w-sm">
                    <SpectrumBar
                        spectrum={state.spectrum}
                        target={state.target}
                        dial={state.dial ?? null}
                    />
                </div>
                <p className="text-lg font-semibold text-white">
                    {state.points === 4 ? '¡En el blanco! 🎯' : `+${state.points ?? 0} puntos`}
                </p>
                {me && (
                    <p className="text-sm text-gray-400">
                        Llevas <span className={ClassnameHelper.join('font-bold', acc.text)}>{me.score}</span>{' '}
                        puntos
                    </p>
                )}
                <p className="text-sm text-gray-400">Mira la pantalla principal 📺</p>
            </Card>
        );
    }

    // clue / guess
    if (isPsychic) {
        return (
            <Card>
                <Eyebrow className={acc.text}>Eres el psíquico 🔮</Eyebrow>
                <div className="w-full max-w-sm">
                    <SpectrumBar spectrum={state.spectrum} target={privateTarget ?? undefined} />
                </div>
                {state.phase === 'clue' ? (
                    <p className="max-w-xs text-sm text-gray-300">
                        Da <span className="font-semibold text-white">una sola pista</span> para situar
                        la zona azul entre los dos extremos. ¡No digas dónde está exactamente!
                    </p>
                ) : (
                    <p className="max-w-xs text-sm text-gray-300">
                        El equipo está moviendo el dial. Aguanta… 🤫 (no toques la pantalla)
                    </p>
                )}
            </Card>
        );
    }

    return (
        <Card>
            <Eyebrow className={acc.text}>
                {state.phase === 'clue' ? 'Escucha la pista' : 'A adivinar'}
            </Eyebrow>
            <div className="w-full max-w-sm">
                <SpectrumBar spectrum={state.spectrum} />
            </div>
            <p className="max-w-xs text-sm text-gray-300">
                {state.phase === 'clue'
                    ? `${state.psychic.name} va a dar una pista. ¡Atento!`
                    : `Debatid y mové el dial en la pantalla principal hasta la pista de ${state.psychic.name}.`}
            </p>
        </Card>
    );
}

function FinalPhone({ seat, state }: { seat: number; state: SintoniaState }) {
    const scores = state.scores ?? [];
    const rank = scores.findIndex((s) => s.seat === seat) + 1;
    const me = scores[rank - 1];
    const isChampion = rank === 1;
    return (
        <Card>
            <span className="text-5xl" aria-hidden="true">
                {isChampion ? '🏆' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '📡'}
            </span>
            <p className="text-2xl font-extrabold text-white">
                {isChampion ? '¡Has ganado!' : `Puesto ${rank || '—'}`}
            </p>
            {me && <p className="text-sm text-gray-400">{me.score} puntos</p>}
            <p className="text-sm text-gray-400">Mira la clasificación en la pantalla 📺</p>
        </Card>
    );
}
