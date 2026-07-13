'use client';

import { Eyebrow } from '@/platform/ui/Eyebrow';
import { Surface } from '@/platform/ui/Surface';
import { ClassnameHelper } from '@/platform/util/classnames';
import { FC } from 'react';
import { BiSolidMask } from 'react-icons/bi';
import type { CamaleonRoom } from './domain';

interface CamaleonCardProps {
    payload: CamaleonRoom;
    seat: number;
}

/**
 * The 4×4 board shown on every phone. `highlight` marks the secret word's cell (lime
 * tile) for ordinary players so they can locate it; the Chameleon is passed `null`, so
 * their board gives nothing away — they must deduce the word from what everyone says.
 */
const WordGrid: FC<{ words: string[]; highlight: number | null }> = ({ words, highlight }) => (
    <div className="mt-4 grid w-full grid-cols-4 gap-2">
        {words.map((word, i) => (
            <div
                key={`${i}-${word}`}
                className={ClassnameHelper.join(
                    'flex min-h-12 items-center justify-center break-words rounded-xl px-1.5 py-2 text-center text-xs font-medium leading-tight ring-1 ring-inset',
                    i === highlight
                        ? 'bg-lime-500/20 font-bold text-lime-200 ring-lime-400/50'
                        : 'bg-white/5 text-gray-300 ring-white/10',
                )}
            >
                {word}
            </div>
        ))}
    </div>
);

/** This phone's secret Camaleón card: either "you are the Chameleon" or the secret word. */
export const CamaleonCard: FC<CamaleonCardProps> = ({ payload, seat }) => {
    // Every seat is valid: it is either the Chameleon's seat or an ordinary player.
    // Camaleón carries no per-seat array, so there is no "partida completa" guard.
    const isChameleon = seat === payload.chameleonSeat;

    return (
        <main className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
            <Eyebrow className="mb-3">Jugador {seat}</Eyebrow>

            <Surface
                tone={isChameleon ? 'plain' : 'panel'}
                className={ClassnameHelper.join(
                    'flex w-full max-w-sm flex-col items-center p-8 text-center',
                    isChameleon && 'bg-lime-950/60 ring-lime-500/40',
                )}
            >
                {isChameleon ? (
                    <>
                        <BiSolidMask className="text-lime-400" size={56} />
                        <h1 className="mt-3 text-3xl font-extrabold uppercase tracking-wide text-lime-300">
                            Eres el Camaleón
                        </h1>
                        <p className="mt-3 text-sm text-gray-300">
                            No conoces la palabra. Disimula y averíguala.
                        </p>
                    </>
                ) : (
                    <>
                        <Eyebrow>Tu palabra</Eyebrow>
                        <h1 className="mt-1 text-3xl font-extrabold text-lime-300">
                            {payload.grid[payload.secretIndex]}
                        </h1>
                        <p className="mt-3 text-sm text-gray-300">
                            Di una palabra relacionada para demostrar que la conoces… sin que el
                            camaleón la adivine.
                        </p>
                    </>
                )}
            </Surface>

            <section className="mt-8 flex w-full max-w-sm flex-col items-center">
                <Eyebrow as="p" className="mb-1 block text-center">
                    Tema
                </Eyebrow>
                <p className="text-lg font-bold text-white">{payload.theme}</p>
                <WordGrid
                    words={payload.grid}
                    highlight={isChameleon ? null : payload.secretIndex}
                />
            </section>
        </main>
    );
};
