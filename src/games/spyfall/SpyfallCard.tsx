'use client';

import { Chip } from '@/platform/ui/Chip';
import { Eyebrow } from '@/platform/ui/Eyebrow';
import { Surface } from '@/platform/ui/Surface';
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
        <Eyebrow as="p" className="mb-2 block text-center">
            Lugares posibles
        </Eyebrow>
        <div className="flex flex-wrap justify-center gap-1.5">
            {SPYFALL_LOCATION_NAMES.map((name) => (
                <Chip key={name}>{name}</Chip>
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

    const isSpy = seat === payload.spySeat;

    return (
        <main className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
            <Eyebrow className="mb-3">Jugador {seat}</Eyebrow>

            <Surface
                tone={isSpy ? 'plain' : 'panel'}
                className={ClassnameHelper.join(
                    'flex w-full max-w-sm flex-col items-center p-8 text-center',
                    isSpy && 'bg-rose-950/60 ring-rose-500/40',
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
                        <Eyebrow>El lugar es</Eyebrow>
                        <h1 className="mt-1 text-3xl font-extrabold text-white">
                            {payload.location}
                        </h1>
                        <Surface tone="inset" radius="2xl" className="mt-5 px-5 py-3">
                            <Eyebrow>Tu rol</Eyebrow>
                            <p className="text-xl font-bold text-rose-200">
                                {payload.roleBySeat[seat - 1]}
                            </p>
                        </Surface>
                    </>
                )}
            </Surface>

            <LocationList />
        </main>
    );
};
