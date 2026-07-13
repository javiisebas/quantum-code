'use client';

import Confetti from 'react-confetti';

/**
 * The one celebration in the arcade. Four screens each wrapped `react-confetti` in their own
 * `fixed inset-0` div with their own piece count (240 / 260 / 280) and gravity — four subtly
 * different parties. This is the single recipe; only the colours are a game's own.
 *
 * It is a BURST, not weather: `recycle={false}` emits the pieces once and stops, so the
 * celebration lands and then gets out of the way of the result underneath it. Re-fire it by
 * remounting (a fresh `key`), the way a round reveal does.
 */

/** Brand-neutral default: purple (the app's colour) with a gold accent. */
const CELEBRATION = ['#a855f7', '#c084fc', '#e9d5ff', '#facc15', '#ffffff'];

export function ConfettiBurst({ colors = CELEBRATION }: { colors?: string[] }) {
    return (
        <div className="pointer-events-none fixed inset-0 z-50">
            <Confetti recycle={false} numberOfPieces={260} gravity={0.25} colors={colors} />
        </div>
    );
}
