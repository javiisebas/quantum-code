'use client';

import type { GameManifest } from '@/games/types';
import { Chip } from '@/platform/ui/Chip';
import { Screen, ScreenBody } from '@/platform/ui/Screen';
import { TopBar } from '@/platform/ui/TopBar';
import { ReactNode } from 'react';

/**
 * The shared screen a live game is PLAYED on, once the lobby hands over. The three live games had
 * three copies of the same header (emoji + name + a round chip) over three copies of the same
 * `min-h-screen` stack — and, being `min-h-screen`, the board could grow past the TV and quietly
 * push the round counter or the host's "siguiente ronda" button off the bottom.
 *
 * So it is the lobby's contract, continued: exactly one viewport (`Screen height="fit"`), the one
 * `TopBar` (which also puts "home" back in the corner mid-game, where every other screen has it),
 * and a stage that scrolls INSIDE itself if a round has more to say than fits.
 *
 * `safe center` (not plain `justify-center`) is what makes that scroll usable: a short stage sits
 * optically centred, but once it overflows, plain centring would push its first rows out of the
 * TOP of the scroll box where they can never be scrolled back to.
 */
export function LiveBoard({
    manifest,
    accentChip,
    round,
    totalRounds,
    children,
}: {
    manifest: GameManifest;
    /** The game's accent chip classes, so the round counter carries its colour. */
    accentChip: string;
    /** `null` once the game is over — there is no round left to count. */
    round: number | null;
    totalRounds: number;
    children: ReactNode;
}) {
    return (
        // The one page rail, a capped STAGE — the same split the lobby uses. Capping the page
        // instead would shrink the top bar to the stage's width, so the header would visibly jump
        // inward the moment the host pressed "Empezar". Chrome stays put; only content is measured.
        <Screen>
            <TopBar
                emoji={manifest.emoji}
                title={manifest.name}
                right={
                    round !== null && (
                        <Chip className={accentChip}>
                            Ronda {round}/{totalRounds}
                        </Chip>
                    )
                }
            />

            {/*
             * The cap lives on the STAGE (`width="stage"`), not on the page, and the stage is also
             * the scroll box: a stage that wants to pin a CTA under a long list (the podium, a
             * 12-answer vote) needs a bounded height to claim `flex-1 min-h-0` against, and it
             * only gets one if the box it sits in is the one that scrolls.
             */}
            <ScreenBody width="stage">{children}</ScreenBody>
        </Screen>
    );
}
