'use client';

import { RoundFullCard } from '@/games/_shared/RoundFullCard';
import { SecretCardScreen } from '@/games/_shared/SecretCardScreen';
import { Chip } from '@/platform/ui/Chip';
import { Eyebrow } from '@/platform/ui/Eyebrow';
import { Surface } from '@/platform/ui/Surface';
import { ClassnameHelper } from '@/platform/util/classnames';
import { FC, ReactNode } from 'react';
import { BiSolidUserX } from 'react-icons/bi';
import { SPYFALL_LOCATION_NAMES, type SpyfallSeatView } from './domain';
import { spyfallManifest } from './manifest';

interface SpyfallCardProps {
    view: SpyfallSeatView;
    /** Extra top-bar actions — the host playing from their own phone keeps its controls here. */
    actions?: ReactNode;
}

/** The same on every phone: the spy's only lead, and everyone else's checklist. */
const LocationList = () => (
    <>
        <Eyebrow as="p" className="mb-2 text-center">
            Lugares posibles
        </Eyebrow>
        <div className="flex flex-wrap justify-center gap-1.5">
            {SPYFALL_LOCATION_NAMES.map((name) => (
                <Chip key={name}>{name}</Chip>
            ))}
        </div>
    </>
);

/** This phone's secret Spyfall card: either "you are the spy" or location + role. */
export const SpyfallCard: FC<SpyfallCardProps> = ({ view, actions }) => {
    // More phones joined than seats dealt — this player has no assignment this round.
    if (view.kind === 'full') {
        return <RoundFullCard />;
    }

    const isSpy = view.kind === 'spy';

    return (
        <SecretCardScreen
            manifest={spyfallManifest}
            seat={view.seat}
            reference={<LocationList />}
            actions={actions}
        >
            <Surface
                tone={isSpy ? 'plain' : 'panel'}
                className={ClassnameHelper.join(
                    'flex w-full flex-col items-center p-6 text-center sm:p-8',
                    isSpy && 'bg-rose-950/60 ring-rose-500/40',
                )}
            >
                {view.kind === 'spy' ? (
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
                        <h1 className="mt-1 text-3xl font-extrabold text-white">{view.location}</h1>
                        <Surface tone="inset" radius="2xl" className="mt-5 px-5 py-3">
                            <Eyebrow>Tu rol</Eyebrow>
                            <p className="text-xl font-bold text-rose-200">{view.role}</p>
                        </Surface>
                    </>
                )}
            </Surface>
        </SecretCardScreen>
    );
};
