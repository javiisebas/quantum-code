'use client';

import { RoundFullCard } from '@/games/_shared/RoundFullCard';
import { SecretCardScreen } from '@/games/_shared/SecretCardScreen';
import { Eyebrow } from '@/platform/ui/Eyebrow';
import { Surface } from '@/platform/ui/Surface';
import { FC, ReactNode } from 'react';
import type { UndercoverSeatView } from './domain';
import { undercoverManifest } from './manifest';

interface UndercoverCardProps {
    view: UndercoverSeatView;
    /** Extra top-bar actions — the host playing from their own phone keeps its controls here. */
    actions?: ReactNode;
}

/**
 * This phone's secret Undercover card: only the word. Every player sees the exact same
 * layout — the card NEVER reveals whether this player is the impostor.
 */
export const UndercoverCard: FC<UndercoverCardProps> = ({ view, actions }) => {
    // More phones joined than seats dealt — this player has no assignment this round.
    if (view.kind === 'full') {
        return <RoundFullCard />;
    }

    return (
        <SecretCardScreen manifest={undercoverManifest} seat={view.seat} actions={actions}>
            <Surface className="flex w-full flex-col items-center p-6 text-center sm:p-8">
                <Eyebrow>Tu palabra</Eyebrow>
                <h1 className="mt-1 text-3xl font-extrabold text-emerald-300">{view.word}</h1>
                <p className="mt-4 text-sm text-gray-300">
                    Descríbela con una sola palabra en cada ronda y desenmascara al impostor sin
                    delatarte.
                </p>
            </Surface>
        </SecretCardScreen>
    );
};
