'use client';

import type { GameManifest } from '@/games/types';
import { Eyebrow } from '@/platform/ui/Eyebrow';
import { HowToPlayButton } from '@/platform/ui/HowToPlay';
import { Screen } from '@/platform/ui/Screen';
import { TopBar } from '@/platform/ui/TopBar';
import { ReactNode } from 'react';

/**
 * The frame every "one phone, one secret" card sits in — Spyfall, Impostor, Hombres Lobo and
 * El Camaleón.
 *
 * Each of the four hand-rolled its own `<main className="flex min-h-screen …">`, so the same
 * player, holding the same phone, met a different page in each game: no way back out, no way to
 * re-read the rules once the round had started (they were only ever on the HOST's screen, across
 * the room), and a different idea of how wide the content column was. The frame is now one thing,
 * on every game, in the same place.
 *
 * What is shared is the FRAME. The secret is not: each game still renders its own card as
 * `children` — the tinted "you are the spy" panel, the role art, the word — because that is what
 * makes each game feel like itself.
 */
export function SecretCardScreen({
    manifest,
    seat,
    children,
    reference,
}: {
    manifest: GameManifest;
    /** This phone's 1-based seat — how a player says "me" out loud during the round. */
    seat: number;
    /** This game's secret card. */
    children: ReactNode;
    /**
     * Shared reference material shown below the secret and IDENTICAL on every phone (Spyfall's
     * list of possible locations, El Camaleón's 16-word board). It reveals nothing on its own, so
     * it lives outside the card.
     */
    reference?: ReactNode;
}) {
    return (
        // Full-width page so the CHROME spans it (a top bar squeezed into a 448px column in the
        // middle of a laptop, with the game's name truncated, is not chrome — it's debris). The
        // content column is what's capped, and it stays phone-width because that is what it is.
        <Screen width="full">
            <TopBar
                emoji={manifest.emoji}
                title={manifest.name}
                right={<HowToPlayButton manifest={manifest} />}
            />

            {/* A card plus its reference material (16 word tiles, a dozen location chips) outgrows
                a short phone, so the scroll lives HERE — inside the single viewport `Screen`
                guarantees — and the top bar never leaves. `min-h-full` + `justify-center` on the
                inner track is what centres a short card without clipping the top of a tall one;
                `justify-center` on the scroll container itself would cut the overflow off. */}
            <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="mx-auto flex min-h-full w-full max-w-md flex-col items-center justify-center py-4 short:py-2">
                    <Eyebrow className="mb-3 short:mb-2">Jugador {seat}</Eyebrow>
                    {children}
                    {reference && <div className="mt-7 w-full short:mt-5">{reference}</div>}
                </div>
            </div>
        </Screen>
    );
}
