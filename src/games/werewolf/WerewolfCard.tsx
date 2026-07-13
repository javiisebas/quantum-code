'use client';

import { Chip } from '@/platform/ui/Chip';
import { Eyebrow } from '@/platform/ui/Eyebrow';
import { Surface } from '@/platform/ui/Surface';
import { ClassnameHelper } from '@/platform/util/classnames';
import { FC } from 'react';
import { WEREWOLF_ROLES, type WerewolfSeatView } from './domain';

interface WerewolfCardProps {
    view: WerewolfSeatView;
}

/** This phone's secret Hombres Lobo card: the role dealt to this seat. */
export const WerewolfCard: FC<WerewolfCardProps> = ({ view }) => {
    // More phones joined than seats dealt — this player has no assignment this round.
    if (view.kind === 'full') {
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

    const info = WEREWOLF_ROLES[view.role];
    const isWolf = info.team === 'lobos';

    return (
        <main className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
            <Eyebrow className="mb-3">Jugador {view.seat}</Eyebrow>

            <Surface
                tone={isWolf ? 'plain' : 'panel'}
                className={ClassnameHelper.join(
                    'flex w-full max-w-sm flex-col items-center p-8 text-center',
                    isWolf && 'bg-rose-950/60 ring-rose-500/40',
                )}
            >
                <span className="text-6xl" aria-hidden="true">
                    {info.emoji}
                </span>

                <Eyebrow className="mt-3">Tu rol</Eyebrow>
                <h1
                    className={ClassnameHelper.join(
                        'mt-1 text-3xl font-extrabold',
                        isWolf ? 'uppercase tracking-wide text-rose-300' : 'text-white',
                    )}
                >
                    {info.label}
                </h1>

                <Chip
                    tone="bare"
                    className={ClassnameHelper.join(
                        'mt-4 font-semibold uppercase tracking-widest ring-1 ring-inset',
                        isWolf
                            ? 'bg-rose-500/15 text-rose-300 ring-rose-500/40'
                            : 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/40',
                    )}
                >
                    {isWolf ? 'Lobos' : 'Aldea'}
                </Chip>

                <p className="mt-5 text-sm text-gray-300">{info.description}</p>
            </Surface>
        </main>
    );
};
