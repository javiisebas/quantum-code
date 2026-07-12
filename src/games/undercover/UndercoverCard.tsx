'use client';

import { FC } from 'react';
import type { UndercoverRoom } from './domain';

interface UndercoverCardProps {
    payload: UndercoverRoom;
    seat: number;
}

/**
 * This phone's secret Undercover card: only the word. Every player sees the exact same
 * layout — the card NEVER reveals whether this player is the impostor.
 */
export const UndercoverCard: FC<UndercoverCardProps> = ({ payload, seat }) => {
    // More phones joined than seats dealt — this player has no assignment this round.
    if (seat > payload.wordBySeat.length) {
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

    return (
        <main className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
            <span className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-500">
                Jugador {seat}
            </span>

            <div className="flex w-full max-w-sm flex-col items-center rounded-3xl bg-gray-900/80 p-8 text-center ring-1 ring-inset ring-white/10 backdrop-blur">
                <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                    Tu palabra
                </span>
                <h1 className="mt-1 text-3xl font-extrabold text-emerald-300">
                    {payload.wordBySeat[seat - 1]}
                </h1>
                <p className="mt-4 text-sm text-gray-300">
                    Descríbela con una sola palabra en cada ronda y desenmascara al impostor sin
                    delatarte.
                </p>
            </div>
        </main>
    );
};
