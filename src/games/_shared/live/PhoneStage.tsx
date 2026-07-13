'use client';

import type { GameManifest } from '@/games/types';
import { HowToPlayButton } from '@/platform/ui/HowToPlay';
import { Loading } from '@/platform/ui/Loading';
import { Screen, ScreenBody } from '@/platform/ui/Screen';
import { Surface } from '@/platform/ui/Surface';
import { TopBar } from '@/platform/ui/TopBar';
import { ClassnameHelper } from '@/platform/util/classnames';
import { createContext, ReactNode, useContext } from 'react';

/**
 * The phone half of a live game: one screen, one column, always centred — and, now, the same
 * chrome as every other screen in the arcade.
 *
 * Two things were wrong, and the second was the real one:
 *
 * 1. Each live game had its own name for this (`Card`, `Card`, `CenteredCard`) and its own
 *    `min-h-screen` stack, so a phone could scroll a hair or clip its CTA depending on which game
 *    you were in. That is now the platform's `Screen height="fit"` contract, same as everywhere:
 *    exactly one viewport, and the stage — the only thing that can outgrow it (a 12-answer vote)
 *    — scrolls inside itself.
 *
 * 2. It was the ONE screen in the arcade with no `<TopBar>` at all — and, worse, the one screen
 *    that capped the PAGE (`max-w-md`) rather than its content. So the player holding a phone in
 *    Chispas had no way home, no way to re-read the rules mid-round, and nothing naming the game
 *    they were in — while the player holding a phone in Spyfall (`SecretCardScreen`) had all
 *    three. Same product, same device, two different shells. Now there is one.
 *
 * The manifest arrives by CONTEXT rather than as a prop because `LivePlayerShell` already knows
 * it and the games render `<PhoneStage>` from a dozen different phase components: threading a
 * prop through every one of them would be a dozen chances to forget it, and forgetting it is how
 * the chrome drifted apart in the first place.
 */
const LiveManifestContext = createContext<GameManifest | null>(null);

/** Wraps a live game's phone screens so every `<PhoneStage>` under it knows which game it is. */
export function LiveManifestProvider({
    manifest,
    children,
}: {
    manifest: GameManifest;
    children: ReactNode;
}) {
    return <LiveManifestContext.Provider value={manifest}>{children}</LiveManifestContext.Provider>;
}

export function PhoneStage({ children, className }: { children: ReactNode; className?: string }) {
    const manifest = useContext(LiveManifestContext);
    return (
        <Screen>
            {manifest && (
                <TopBar
                    emoji={manifest.emoji}
                    title={manifest.name}
                    right={<HowToPlayButton manifest={manifest} />}
                />
            )}
            <ScreenBody
                className={ClassnameHelper.join('gap-6 text-center short:gap-5', className)}
            >
                {children}
            </ScreenBody>
        </Screen>
    );
}

/**
 * In the room, waiting for the host to start. The one wait, with this player's name on it.
 *
 * A wait carries no chrome anywhere in the arcade (see `Loading`): a top bar that flashes in for
 * a spinner and out again is worse than no top bar, and there is nothing on a wait to act on.
 */
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
            <Surface as="section" className="w-full p-8">
                <p className="text-lg font-semibold text-white">Hola, {name} 👋</p>
                <p className="mt-2 text-sm text-gray-400">
                    La partida ya ha empezado. Entrarás cuando el anfitrión empiece una nueva.
                </p>
            </Surface>
        </PhoneStage>
    );
}
