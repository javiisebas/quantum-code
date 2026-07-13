'use client';

import { Loading } from '@/platform/ui/Loading';
import { Screen } from '@/platform/ui/Screen';
import { Surface } from '@/platform/ui/Surface';
import { ClassnameHelper } from '@/platform/util/classnames';
import { ReactNode } from 'react';

/**
 * The phone half of a live game: one screen, one column, always centred.
 *
 * Each live game had its own name for this (`Card`, `Card`, `CenteredCard`) and its own
 * `min-h-screen` stack, so a phone could scroll a hair or clip its CTA depending on which game
 * you were in. It is the platform's `Screen height="fit"` contract, same as every other screen:
 * exactly one viewport, and the stage — the only thing that can outgrow it (a 12-answer vote) —
 * scrolls inside itself.
 */
export function PhoneStage({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <Screen width="md" height="fit">
            <div
                className={ClassnameHelper.join(
                    'flex min-h-0 flex-1 flex-col items-center gap-6 overflow-y-auto py-4 text-center',
                    // See `LiveBoard`: plain centring would strand the top of an overflowing stage.
                    '[justify-content:safe_center]',
                    className,
                )}
            >
                {children}
            </div>
        </Screen>
    );
}

/** In the room, waiting for the host to start. The one wait, with this player's name on it. */
export function LiveWaiting({ name, emoji }: { name: string; emoji: string }) {
    return (
        <Loading
            label={`¡Estás dentro, ${name}! ${emoji}`}
            hint="Esperando a que el anfitrión empiece la partida…"
        />
    );
}

/** Joined after the host started: the roster is frozen, so sit this one out. */
export function LateJoinCard({ name }: { name: string }) {
    return (
        <PhoneStage>
            <Surface as="section" className="w-full max-w-sm p-8">
                <p className="text-lg font-semibold text-white">Hola, {name} 👋</p>
                <p className="mt-2 text-sm text-gray-400">
                    La partida ya ha empezado. Entrarás cuando el anfitrión empiece una nueva.
                </p>
            </Surface>
        </PhoneStage>
    );
}
