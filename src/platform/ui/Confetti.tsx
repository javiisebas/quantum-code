'use client';

import { useReducedMotion } from 'framer-motion';
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

/**
 * How big the party is — a token, not a free `numberOfPieces`, so the two moments stay
 * distinguishable and can't drift apart per call site:
 *
 *  - `final` → the end of a game. The biggest moment the arcade has; it may be loud.
 *  - `round` → a between-round reveal (a bullseye, the funniest answer). It fires every
 *    round, so it stays a spark: if a round popped as hard as the podium, the podium would
 *    stop feeling like the end of anything.
 */
export type ConfettiIntensity = 'final' | 'round';

const PIECES: Record<ConfettiIntensity, number> = { final: 320, round: 140 };

export function ConfettiBurst({
    colors = CELEBRATION,
    intensity = 'final',
}: {
    colors?: string[];
    intensity?: ConfettiIntensity;
}) {
    // The confetti is a canvas, so it sits OUTSIDE `<MotionConfig reducedMotion="user">` and
    // has to opt in by hand: to someone who asked for less motion, 300 pieces of paper falling
    // across the whole viewport is precisely the motion they asked us not to make. The result
    // underneath it (podium, medals, score) is untouched — only the party is skipped.
    const prefersReducedMotion = useReducedMotion();
    if (prefersReducedMotion) return null;

    return (
        <div className="pointer-events-none fixed inset-0 z-50">
            <Confetti
                recycle={false}
                numberOfPieces={PIECES[intensity]}
                gravity={0.25}
                colors={colors}
            />
        </div>
    );
}
