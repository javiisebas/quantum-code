'use client';

import type { GameManifest } from '@/games/types';
import { Eyebrow } from '@/platform/ui/Eyebrow';
import { HowToPlayButton } from '@/platform/ui/HowToPlay';
import { Screen, ScreenBody } from '@/platform/ui/Screen';
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
    actions,
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
    /**
     * Extra top-bar actions BEFORE the rules button. A guest's phone has none; the host playing
     * from their own phone («Yo también juego») keeps the way back to the room — QR, roster,
     * new round — here, because chrome is where a screen's controls live.
     */
    actions?: ReactNode;
}) {
    return (
        // The one page rail so the CHROME spans it (a top bar squeezed into a 448px column in the
        // middle of a laptop, with the game's name truncated, is not chrome — it's debris). The
        // content column is what's capped, and it is the arcade's one `card` width, because a
        // secret card is exactly that.
        <Screen>
            <TopBar
                emoji={manifest.emoji}
                title={manifest.name}
                right={
                    <>
                        {actions}
                        <HowToPlayButton manifest={manifest} />
                    </>
                }
            />

            {/* A card plus its reference material (16 word tiles, a dozen location chips) outgrows
                a short phone, so it scrolls INSIDE `<ScreenBody>` — the one scroll box on the page,
                inside the single viewport `Screen` guarantees — and the top bar never leaves. The
                body's `safe center` is what centres a short card without stranding the top of a
                tall one out of reach. */}
            <ScreenBody>
                <Eyebrow className="mb-3 short:mb-2">Jugador {seat}</Eyebrow>
                {children}
                {reference && <div className="mt-7 w-full short:mt-5">{reference}</div>}
            </ScreenBody>
        </Screen>
    );
}
