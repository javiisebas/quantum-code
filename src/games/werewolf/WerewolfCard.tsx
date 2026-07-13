'use client';

import { RoundFullCard } from '@/games/_shared/RoundFullCard';
import { SecretCardScreen } from '@/games/_shared/SecretCardScreen';
import { Chip } from '@/platform/ui/Chip';
import { Eyebrow } from '@/platform/ui/Eyebrow';
import { Surface } from '@/platform/ui/Surface';
import { ClassnameHelper } from '@/platform/util/classnames';
import { FC, ReactNode } from 'react';
import { WEREWOLF_ROLES, type WerewolfSeatView } from './domain';
import { werewolfManifest } from './manifest';

interface WerewolfCardProps {
    view: WerewolfSeatView;
    /** Extra top-bar actions — the host playing from their own phone keeps its controls here. */
    actions?: ReactNode;
}

/** This phone's secret Hombres Lobo card: the role dealt to this seat. */
export const WerewolfCard: FC<WerewolfCardProps> = ({ view, actions }) => {
    // More phones joined than seats dealt — this player has no assignment this round.
    if (view.kind === 'full') {
        return <RoundFullCard />;
    }

    const info = WEREWOLF_ROLES[view.role];
    const isWolf = info.team === 'lobos';

    return (
        <SecretCardScreen manifest={werewolfManifest} seat={view.seat} actions={actions}>
            <Surface
                tone={isWolf ? 'plain' : 'panel'}
                className={ClassnameHelper.join(
                    'flex w-full flex-col items-center p-6 text-center sm:p-8',
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
        </SecretCardScreen>
    );
};
