'use client';

import { Spinner } from '@heroui/react';

/**
 * The one full-screen loading state. Nine screens each reached for HeroUI's `<Spinner>`
 * directly, with their own wrapper (`h-screen` here, `min-h-screen` there) and their own colour
 * — so the app flickered between subtly different waits. This is the single recipe.
 *
 * `hint` is the optional second line. The three live games each drew their own "you're in, now
 * wait for the host" CARD around a raw spinner, when what they were showing was just a wait with
 * two things to say: who is in ("¡Estás dentro, Ana! 💣") and what is being waited on.
 */
export function Loading({ label, hint }: { label: string; hint?: string }) {
    return (
        <div className="flex h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
            <Spinner color="secondary" label={label} />
            {hint && <p className="max-w-xs text-sm text-gray-400">{hint}</p>}
        </div>
    );
}
