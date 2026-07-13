'use client';

import { Screen, ScreenBody } from '@/platform/ui/Screen';
import { Spinner } from '@heroui/react';

/**
 * The one full-screen loading state. Nine screens each reached for HeroUI's `<Spinner>`
 * directly, with their own wrapper (`h-screen` here, `min-h-screen` there) and their own colour
 * — so the app flickered between subtly different waits. This is the single recipe.
 *
 * `hint` is the optional second line. The three live games each drew their own "you're in, now
 * wait for the host" CARD around a raw spinner, when what they were showing was just a wait with
 * two things to say: who is in ("¡Estás dentro, Ana! 💣") and what is being waited on.
 *
 * It sits in the same `<Screen>` as everything else — so the page it replaces doesn't jump when
 * it resolves — but carries NO `<TopBar>`: a wait has nothing to act on and nothing to be called,
 * and chrome that flashes in for a spinner and straight back out is worse than no chrome.
 */
export function Loading({ label, hint }: { label: string; hint?: string }) {
    return (
        <Screen>
            <ScreenBody className="gap-3 text-center">
                <Spinner color="secondary" label={label} />
                {hint && <p className="max-w-xs text-sm text-gray-400">{hint}</p>}
            </ScreenBody>
        </Screen>
    );
}
