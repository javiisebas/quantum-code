'use client';

import { submitInput } from '@/platform/room/live-client';
import { useLiveState } from '@/platform/room/use-live-room';
import { Button } from '@/platform/ui/Button';
import { Eyebrow } from '@/platform/ui/Eyebrow';
import { RankCard } from '@/platform/ui/Podium';
import { Surface } from '@/platform/ui/Surface';
import { ClassnameHelper } from '@/platform/util/classnames';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { accentOf } from '../_shared/accents';
import { LivePlayerShell } from '../_shared/live/LivePlayerShell';
import { LateJoinCard, LiveWaiting, PhoneStage } from '../_shared/live/PhoneStage';
import { BombaState, passRound } from './domain';
import { BOMBA_ID, bombaManifest } from './manifest';

const acc = accentOf(bombaManifest.accent);

/** La Bomba phone: join + name, then render the live phase for this player. */
export function BombaPlayer({ code }: { code: number | null }) {
    return (
        <LivePlayerShell game={BOMBA_ID} code={code}>
            {({ code: roomCode, seat, name, seatToken }) => (
                <BombaPhone code={roomCode} seat={seat} name={name} seatToken={seatToken} />
            )}
        </LivePlayerShell>
    );
}

function BombaPhone({
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
    const state = useLiveState<BombaState>({ game: BOMBA_ID, code });

    // Joined, but the host hasn't started (or published a phase) yet.
    if (!state) {
        return <LiveWaiting name={name} emoji={bombaManifest.emoji} />;
    }

    // Joined after the host started — the roster (and pass order) is frozen, so sit out.
    const inGame = state.players.some((player) => player.seat === seat);
    if (!inGame) {
        return <LateJoinCard name={name} />;
    }

    if (state.phase === 'final') {
        return <FinalPhone seat={seat} state={state} />;
    }

    if (state.phase === 'explosion') {
        return <ExplosionPhone seat={seat} state={state} />;
    }

    // playing
    return state.holderSeat === seat ? (
        <HolderPhone code={code} seat={seat} seatToken={seatToken} state={state} />
    ) : (
        <WaitingPhone seat={seat} state={state} />
    );
}

/** It's my turn: I'm holding the bomb — say an answer out loud, then pass it fast. */
function HolderPhone({
    code,
    seat,
    seatToken,
    state,
}: {
    code: number;
    seat: number;
    seatToken: string;
    state: BombaState;
}) {
    // Track the pass counter I've already responded to, so one tap = one send. When the host
    // advances the bomb `state.pass` moves on and (having passed) I'm no longer the holder; if
    // it ever comes back to me it's a NEW pass number, so the button re-enables on its own.
    const [passedPass, setPassedPass] = useState<number | null>(null);
    const alreadyPassed = passedPass === state.pass;

    const pass = async () => {
        if (alreadyPassed) return;
        setPassedPass(state.pass);
        await submitInput(
            BOMBA_ID,
            code,
            passRound(state.gen, state.round),
            seat,
            { token: state.pass },
            seatToken,
        ).catch(() => {});
    };

    return (
        <PhoneStage>
            <motion.div
                aria-hidden="true"
                className="text-7xl drop-shadow-[0_0_30px_rgba(249,115,22,0.5)] short:text-6xl"
                animate={{ rotate: [-9, 9, -9], scale: [1, 1.1, 1] }}
                transition={{ duration: 0.32, repeat: Infinity, ease: 'easeInOut' }}
            >
                💣
            </motion.div>

            <div>
                <Eyebrow className={acc.text}>¡TÚ tienes la bomba!</Eyebrow>
                <p className="mt-2 text-2xl font-extrabold text-white">{state.category}</p>
                <p className="mt-2 text-sm text-gray-400">
                    Di algo en alto que valga… y ¡pásala ya!
                </p>
            </div>

            <Button
                variant="accent"
                accentClass={acc.solidButton}
                fullWidth
                className="h-24 max-w-sm shrink-0 text-3xl font-extrabold short:h-20"
                onPress={pass}
                isDisabled={alreadyPassed}
            >
                {alreadyPassed ? '¡Pasada! 💨' : '¡Pasar! 💣'}
            </Button>
        </PhoneStage>
    );
}

/** Not my turn: watch, but think of an answer — the bomb is coming. */
function WaitingPhone({ seat, state }: { seat: number; state: BombaState }) {
    const isNext = state.holderSeat === prevSeat(seat, state);
    const holderName =
        state.players.find((player) => player.seat === state.holderSeat)?.name ?? '—';
    return (
        <PhoneStage>
            <span className="text-6xl opacity-80" aria-hidden="true">
                💣
            </span>
            <div>
                <Eyebrow className={acc.text}>La bomba la tiene</Eyebrow>
                <p className="mt-1 text-3xl font-extrabold text-white">{holderName}</p>
            </div>
            <Surface tone="inset" className="w-full max-w-sm p-5">
                <Eyebrow>La categoría</Eyebrow>
                <p className="mt-1 text-lg font-bold text-white">{state.category}</p>
            </Surface>
            <p className="max-w-xs text-sm text-gray-400">
                {isNext
                    ? '¡Eres el siguiente! Ten tu respuesta lista. 👀'
                    : 'Ve pensando tu respuesta… la bomba se acerca.'}
            </p>
        </PhoneStage>
    );
}

/** The bomb blew: show whether it caught me and my running strike count. */
function ExplosionPhone({ seat, state }: { seat: number; state: BombaState }) {
    const caughtMe = state.lastExploded === seat;
    const explodedName =
        state.players.find((player) => player.seat === state.lastExploded)?.name ?? '—';
    const me = (state.scores ?? []).find((score) => score.seat === seat);
    return (
        <PhoneStage>
            <span className="text-6xl" aria-hidden="true">
                💥
            </span>
            {caughtMe ? (
                <p className={ClassnameHelper.join('text-2xl font-extrabold', acc.text)}>
                    ¡Te ha explotado a ti!
                </p>
            ) : (
                <p className="text-xl font-semibold text-white">
                    Le explotó a <span className={acc.text}>{explodedName}</span>
                </p>
            )}
            {me && (
                <p className="text-sm text-gray-300">
                    Llevas{' '}
                    <span className={ClassnameHelper.join('font-bold', acc.text)}>
                        💣 {me.strikes}
                    </span>{' '}
                    {me.strikes === 1 ? 'bombazo' : 'bombazos'}
                </p>
            )}
            <p className="text-sm text-gray-400">Mira la pantalla principal 📺</p>
        </PhoneStage>
    );
}

function FinalPhone({ seat, state }: { seat: number; state: BombaState }) {
    const scores = state.scores ?? [];
    const rank = scores.findIndex((score) => score.seat === seat) + 1;
    const me = scores[rank - 1];
    return (
        <PhoneStage>
            <RankCard
                rank={rank}
                fallbackEmoji="💣"
                caption={me && `${me.strikes} ${me.strikes === 1 ? 'bombazo' : 'bombazos'}`}
            />
        </PhoneStage>
    );
}

/**
 * The seat just before `seat` in the frozen roster (ascending, wrapping). Used only to tell a
 * player they're up next — purely cosmetic, so an unknown seat simply reads as "not next".
 */
function prevSeat(seat: number, state: BombaState): number {
    const seats = state.players.map((player) => player.seat);
    const index = seats.indexOf(seat);
    if (index === -1) return -1;
    return seats[(index - 1 + seats.length) % seats.length];
}
