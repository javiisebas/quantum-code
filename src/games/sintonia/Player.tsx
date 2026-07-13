'use client';

import { useLiveState, usePrivateState } from '@/platform/room/use-live-room';
import { Chip } from '@/platform/ui/Chip';
import { Eyebrow } from '@/platform/ui/Eyebrow';
import { RankCard } from '@/platform/ui/Podium';
import { ClassnameHelper } from '@/platform/util/classnames';
import { motion } from 'framer-motion';
import { accentOf } from '../_shared/accents';
import { LivePlayerShell } from '../_shared/live/LivePlayerShell';
import { LiveWaiting, PhoneStage } from '../_shared/live/PhoneStage';
import { SpectrumBar } from './SpectrumBar';
import type { SintoniaState } from './domain';
import { SINTONIA_ID, sintoniaManifest } from './manifest';

const acc = accentOf(sintoniaManifest.accent);

/** Sintonía phone: join + name, then show this player's live view of the round. */
export function SintoniaPlayer({ code }: { code: number | null }) {
    return (
        <LivePlayerShell game={SINTONIA_ID} code={code}>
            {({ code: roomCode, seat, name, seatToken }) => (
                <SintoniaPhone code={roomCode} seat={seat} name={name} seatToken={seatToken} />
            )}
        </LivePlayerShell>
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
        return <LiveWaiting name={name} emoji={sintoniaManifest.emoji} />;
    }

    // A late joiner simply plays as a (non-psychic) guesser; no roster gating needed.
    const isPsychic = state.psychic.seat === seat;

    if (state.phase === 'final') {
        return <FinalPhone seat={seat} state={state} />;
    }

    if (state.phase === 'reveal') {
        const me = (state.scores ?? []).find((score) => score.seat === seat);
        const points = state.points ?? 0;
        return (
            <PhoneStage>
                <div className="w-full max-w-sm">
                    <SpectrumBar
                        spectrum={state.spectrum}
                        target={state.target}
                        dial={state.dial ?? null}
                    />
                </div>
                {/* The same medallion the shared screen just showed, so both halves agree. */}
                <motion.div
                    className="flex flex-col items-center gap-3"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 280, damping: 18, delay: 0.1 }}
                >
                    <span
                        className={ClassnameHelper.join(
                            'flex h-16 w-16 items-center justify-center rounded-full text-2xl font-extrabold ring-1 ring-inset',
                            acc.highlight,
                            acc.text,
                        )}
                    >
                        +{points}
                    </span>
                    <p className="text-xl font-extrabold text-white">
                        {points === 4
                            ? '¡En el blanco! 🎯'
                            : points === 1
                              ? '1 punto'
                              : `${points} puntos`}
                    </p>
                </motion.div>
                {me && <Chip>Llevas {me.score} puntos</Chip>}
                <p className="text-sm text-gray-400">Mira la pantalla principal 📺</p>
            </PhoneStage>
        );
    }

    // clue / guess
    if (isPsychic) {
        return (
            <PhoneStage>
                <Eyebrow className={acc.text}>Eres el psíquico 🔮</Eyebrow>
                <div className="w-full max-w-sm">
                    <SpectrumBar spectrum={state.spectrum} target={privateTarget ?? undefined} />
                </div>
                {state.phase === 'clue' ? (
                    <p className="max-w-xs text-sm text-gray-300">
                        Da <span className="font-semibold text-white">una sola pista</span> para
                        situar la zona azul entre los dos extremos. ¡No digas dónde está
                        exactamente!
                    </p>
                ) : (
                    <p className="max-w-xs text-sm text-gray-300">
                        El equipo está moviendo el dial. Aguanta… 🤫 (no toques la pantalla)
                    </p>
                )}
            </PhoneStage>
        );
    }

    return (
        <PhoneStage>
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
        </PhoneStage>
    );
}

function FinalPhone({ seat, state }: { seat: number; state: SintoniaState }) {
    const scores = state.scores ?? [];
    const rank = scores.findIndex((score) => score.seat === seat) + 1;
    const me = scores[rank - 1];
    return (
        <PhoneStage>
            <RankCard
                rank={rank}
                fallbackEmoji="📡"
                accent={acc}
                caption={me && `${me.score} puntos`}
            />
        </PhoneStage>
    );
}
