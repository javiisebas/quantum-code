'use client';

import { Chip } from '@/platform/ui/Chip';
import { Eyebrow } from '@/platform/ui/Eyebrow';
import { Surface } from '@/platform/ui/Surface';
import { ClassnameHelper } from '@/platform/util/classnames';
import { ReactNode } from 'react';

/**
 * The right half of every lobby: who is here, and the one action that starts the game.
 *
 * Two deliberate calls:
 *
 *  - **Ghost seats.** When fewer than `min` players have joined, the empty slots are drawn as
 *    dashed placeholders. The old lobby said "0 jugadores", then "Esperando a que se unan los
 *    jugadores…", then greyed the button, then added "Mínimo 3 jugadores para empezar" — four
 *    separate pieces of chrome to express one idea. Three empty boxes filling up as phones
 *    arrive says it in a glance, and the room reads as *waiting for you* rather than *broken*.
 *
 *  - **The roster is the only scrollable thing on the page.** It claims `flex-1 min-h-0` and
 *    scrolls inside itself, so a full room of 16 can never push the CTA off the screen.
 */
export function LobbyPanel({
    names,
    min,
    max,
    accentChip,
    action,
    footer,
}: {
    /** Players currently in the room, in join order. */
    names: string[];
    min: number;
    max: number;
    /** The game's accent chip classes, so the roster carries its colour. */
    accentChip?: string;
    /** The single primary action for this screen (start / deal / new round). */
    action: ReactNode;
    /** Optional secondary action row under the CTA. */
    footer?: ReactNode;
}) {
    const missing = Math.max(0, min - names.length);
    const full = names.length >= max;

    return (
        <Surface className="flex h-full max-h-full flex-col gap-4 p-5 sm:p-6 short:gap-3 short:p-4">
            <div className="flex shrink-0 items-baseline justify-between gap-3">
                <Eyebrow as="h2">Jugadores</Eyebrow>
                <Chip className={names.length >= min ? accentChip : undefined}>
                    <span className="font-mono tabular-nums">
                        {names.length} / {max}
                    </span>
                </Chip>
            </div>

            {/*
             * Centred while it fits — a lobby is empty precisely when the host is looking at it,
             * and the seats should sit in the middle of the panel rather than clinging to the top
             * — and it grows outward from there as phones arrive.
             *
             * `safe center` (not plain `content-center`) is load-bearing: once the list overflows,
             * plain centring pushes the first rows out of the TOP of the scroll box, where they
             * cannot be scrolled back to. `safe` degrades to `start` exactly then, so a full room
             * of 12 stays reachable. `overflow-y-auto` makes this the ONE scrollable region on the
             * page, so a full roster can never push the CTA off-screen.
             */}
            <ul
                className="grid min-h-0 flex-1 auto-rows-min grid-cols-2 gap-2 overflow-y-auto [align-content:safe_center]"
                aria-live="polite"
            >
                {names.map((name, index) => (
                    <li key={`${name}-${index}`}>
                        <Surface
                            tone="inset"
                            radius="xl"
                            className="flex items-center gap-2 p-3 text-left"
                        >
                            <span
                                aria-hidden="true"
                                className={ClassnameHelper.join(
                                    'flex size-6 shrink-0 items-center justify-center rounded-full text-[0.65rem] font-bold uppercase',
                                    accentChip ?? 'bg-white/10 text-gray-200',
                                )}
                            >
                                {name.slice(0, 1)}
                            </span>
                            <span className="truncate text-sm font-semibold text-white">
                                {name}
                            </span>
                        </Surface>
                    </li>
                ))}

                {Array.from({ length: missing }).map((_, index) => (
                    <li key={`ghost-${index}`}>
                        <div
                            aria-hidden="true"
                            className="flex items-center gap-2 rounded-xl border border-dashed border-white/15 p-3"
                        >
                            <span className="size-6 shrink-0 rounded-full bg-white/5" />
                            <span className="h-2 w-12 rounded-full bg-white/5" />
                        </div>
                    </li>
                ))}
            </ul>

            <div className="flex shrink-0 flex-col gap-2">
                {full && (
                    <p className="text-center text-xs text-amber-300">
                        Sala llena. Quien entre ahora esperará a la próxima partida.
                    </p>
                )}
                {action}
                {footer}
            </div>
        </Surface>
    );
}
