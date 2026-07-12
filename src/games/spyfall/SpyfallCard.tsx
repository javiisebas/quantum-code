'use client';

import { ClassnameHelper } from '@/platform/util/classnames';
import { FC } from 'react';
import { BiSolidUserX } from 'react-icons/bi';
import { SPYFALL_LOCATION_NAMES, type SpyfallRoom } from './domain';

interface SpyfallCardProps {
    payload: SpyfallRoom;
    seat: number;
}

const LocationList = () => (
    <div className="mt-6 w-full">
        <p className="mb-2 text-center text-xs font-semibold uppercase tracking-widest text-gray-400">
            Lugares posibles
        </p>
        <div className="flex flex-wrap justify-center gap-1.5">
            {SPYFALL_LOCATION_NAMES.map((name) => (
                <span
                    key={name}
                    className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-gray-300 ring-1 ring-inset ring-white/10"
                >
                    {name}
                </span>
            ))}
        </div>
    </div>
);

/** This phone's secret Spyfall card: either "you are the spy" or location + role. */
export const SpyfallCard: FC<SpyfallCardProps> = ({ payload, seat }) => {
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

    const isSpy = seat === payload.spySeat;

    return (
        <main className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
            <span className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-500">
                Jugador {seat}
            </span>

            <div
                className={ClassnameHelper.join(
                    'flex w-full max-w-sm flex-col items-center rounded-3xl p-8 text-center ring-1 ring-inset',
                    isSpy
                        ? 'bg-rose-950/60 ring-rose-500/40'
                        : 'bg-gray-900/80 ring-white/10 backdrop-blur',
                )}
            >
                {isSpy ? (
                    <>
                        <BiSolidUserX className="text-rose-400" size={56} />
                        <h1 className="mt-3 text-3xl font-extrabold uppercase tracking-wide text-rose-300">
                            Eres el espía
                        </h1>
                        <p className="mt-3 text-sm text-gray-300">
                            No conoces el lugar. Escucha, disimula y averígualo sin que te pillen.
                        </p>
                    </>
                ) : (
                    <>
                        <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                            El lugar es
                        </span>
                        <h1 className="mt-1 text-3xl font-extrabold text-white">
                            {payload.location}
                        </h1>
                        <div className="mt-5 rounded-2xl bg-white/5 px-5 py-3">
                            <span className="text-xs uppercase tracking-widest text-gray-400">
                                Tu rol
                            </span>
                            <p className="text-xl font-bold text-purple-200">
                                {payload.roleBySeat[seat - 1]}
                            </p>
                        </div>
                    </>
                )}
            </div>

            <LocationList />
        </main>
    );
};
