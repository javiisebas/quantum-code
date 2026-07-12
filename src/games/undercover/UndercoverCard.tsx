'use client';

import { Eyebrow } from '@/platform/ui/Eyebrow';
import { Surface } from '@/platform/ui/Surface';
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
                <Surface className="max-w-sm p-8">
                    <p className="text-lg text-gray-200">La partida ya está completa.</p>
                    <p className="mt-2 text-sm text-gray-400">
                        Pide al anfitrión una <span className="font-semibold">nueva ronda</span> con
                        más jugadores.
                    </p>
                </Surface>
            </main>
        );
    }

    return (
        <main className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
            <Eyebrow className="mb-3">Jugador {seat}</Eyebrow>

            <Surface className="flex w-full max-w-sm flex-col items-center p-8 text-center">
                <Eyebrow>Tu palabra</Eyebrow>
                <h1 className="mt-1 text-3xl font-extrabold text-emerald-300">
                    {payload.wordBySeat[seat - 1]}
                </h1>
                <p className="mt-4 text-sm text-gray-300">
                    Descríbela con una sola palabra en cada ronda y desenmascara al impostor sin
                    delatarte.
                </p>
            </Surface>
        </main>
    );
};
