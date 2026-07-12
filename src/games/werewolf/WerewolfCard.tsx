'use client';

import { ClassnameHelper } from '@/platform/util/classnames';
import { FC } from 'react';
import { WEREWOLF_ROLES, type WerewolfRoom } from './domain';

interface WerewolfCardProps {
    payload: WerewolfRoom;
    seat: number;
}

/** This phone's secret Hombres Lobo card: the role dealt to this seat. */
export const WerewolfCard: FC<WerewolfCardProps> = ({ payload, seat }) => {
    // More phones joined than seats dealt — this player has no assignment this round.
    if (seat > payload.roleBySeat.length) {
        return (
            <main className="flex min-h-screen items-center justify-center px-6 text-center">
                <div className="max-w-sm rounded-3xl bg-gray-900/80 p-8 ring-1 ring-inset ring-white/10">
                    <p className="text-lg text-gray-200">La partida ya está completa.</p>
                    <p className="mt-2 text-sm text-gray-400">
                        Pide al anfitrión una <span className="font-semibold">nueva ronda</span> con
                        más jugadores.
                    </p>
                </div>
            </main>
        );
    }

    const role = payload.roleBySeat[seat - 1];
    const info = WEREWOLF_ROLES[role];
    const isWolf = info.team === 'lobos';

    return (
        <main className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
            <span className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-500">
                Jugador {seat}
            </span>

            <div
                className={ClassnameHelper.join(
                    'flex w-full max-w-sm flex-col items-center rounded-3xl p-8 text-center ring-1 ring-inset',
                    isWolf
                        ? 'bg-rose-950/60 ring-rose-500/40'
                        : 'bg-gray-900/80 ring-white/10 backdrop-blur',
                )}
            >
                <span className="text-6xl" aria-hidden="true">
                    {info.emoji}
                </span>

                <span className="mt-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
                    Tu rol
                </span>
                <h1
                    className={ClassnameHelper.join(
                        'mt-1 text-3xl font-extrabold',
                        isWolf ? 'uppercase tracking-wide text-rose-300' : 'text-white',
                    )}
                >
                    {info.label}
                </h1>

                <span
                    className={ClassnameHelper.join(
                        'mt-4 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest ring-1 ring-inset',
                        isWolf
                            ? 'bg-rose-500/15 text-rose-300 ring-rose-500/40'
                            : 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/40',
                    )}
                >
                    {isWolf ? 'Lobos' : 'Aldea'}
                </span>

                <p className="mt-5 text-sm text-gray-300">{info.description}</p>
            </div>
        </main>
    );
};
