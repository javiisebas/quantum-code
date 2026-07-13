'use client';

import type { GameManifest } from '@/games/types';
import { HowToPlayButton } from '@/platform/ui/HowToPlay';
import { RoomShare } from '@/platform/ui/RoomShare';
import { Screen } from '@/platform/ui/Screen';
import { Surface } from '@/platform/ui/Surface';
import { TopBar } from '@/platform/ui/TopBar';
import { ReactNode } from 'react';

/**
 * The lobby every game in the arcade waits in — one component, one layout, one mental model:
 *
 *      ┌──────────────────────────────────────────────┐
 *      │ ⌂  💣 La Bomba              ¿Cómo se juega?   │   chrome (fixed height)
 *      ├───────────────────────┬──────────────────────┤
 *      │   scan the QR         │  who's here          │
 *      │      — or —           │  ────────────        │
 *      │   type the code       │  the one CTA         │
 *      └───────────────────────┴──────────────────────┘
 *        "how do I get in?"       "are we ready?"
 *
 * Two things were wrong with what this replaces, and both are structural rather than cosmetic:
 *
 * 1. It was a PHONE screen shown on a TV. Every host lobby was a `max-w-md` column, so on a
 *    1440px shared screen it rendered as a 375px strip stranded in the middle — and it STILL
 *    overflowed vertically, because the content grew as an unbounded stack (emoji, title, QR,
 *    code, two full-width buttons, an explanatory paragraph, a count, a waiting line, the CTA,
 *    a minimum-players line, a home button, a rules paragraph). The host screen is the shared
 *    screen: it gets a landscape split that always fits, and the phone gets the same content in
 *    one compact column.
 *
 * 2. It answered two different questions in one undifferentiated column. Getting in and starting
 *    are separate jobs for separate people (the guests vs the host), so they get separate halves.
 *
 * The page NEVER scrolls (`Screen height="fit"`). If a roster outgrows its half it scrolls
 * inside itself — the code, the QR and the CTA are load-bearing and must never leave the screen.
 */
export function HostLobby({
    manifest,
    code,
    children,
}: {
    manifest: GameManifest;
    /** The join code — the room is already open by the time a lobby renders. */
    code: number;
    /** The right half: who's here, and the one action that starts the game. */
    children: ReactNode;
}) {
    return (
        <Screen width="full" height="fit">
            <TopBar
                emoji={manifest.emoji}
                title={manifest.name}
                right={<HowToPlayButton manifest={manifest} />}
            />

            {/*
             * The two halves are the SAME height (`items-stretch`) and share a baseline: two
             * cards of different heights floating at different offsets is exactly the "sucio"
             * look this rewrite exists to kill. Each half then centres its own content, so the
             * QR and the roster sit on the same optical line.
             *
             * On a phone the rows are `auto` + `minmax(0,1fr)`: the way in keeps its natural
             * height and the ROSTER is what gives, absorbing the squeeze by scrolling inside
             * itself. Without that, a short phone would CLIP the CTA rather than shrink to it.
             */}
            <div className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] items-stretch gap-4 py-2 lg:my-auto lg:max-h-[36rem] lg:grid-cols-2 lg:grid-rows-1 lg:gap-6 lg:py-4">
                <Surface className="flex min-h-0 items-center justify-center p-5 sm:p-6 lg:p-8 short:p-4">
                    <RoomShare
                        code={code}
                        gameName={manifest.name}
                        // Small enough to leave room for the roster on a phone, big enough to scan
                        // from a sofa on a TV — and smaller again on a short phone (SE-sized), where
                        // the alternative is the code or the button falling off the bottom.
                        qrClassName="max-w-[160px] sm:max-w-[200px] lg:max-w-[232px] short:max-w-[124px]"
                    />
                </Surface>

                <div className="flex min-h-0 flex-col">{children}</div>
            </div>
        </Screen>
    );
}
