import { ClassnameHelper } from '@/platform/util/classnames';
import { ReactNode } from 'react';

/**
 * The page shell every screen in the arcade sits in. Before this, each screen hand-rolled its
 * own `<main className="mx-auto flex min-h-screen max-w-md …">`, which is how the host lobby
 * ended up as a 375px column stranded in the middle of a 1440px TV — and how it grew taller
 * than the viewport without anyone noticing.
 *
 * Two layout contracts, and the choice is the whole point:
 *
 *  - `height="fit"` (default) → the page is EXACTLY one viewport tall (`h-dvh`) and never
 *    scrolls. Anything that can overflow (a long roster, a board) must claim `flex-1 min-h-0`
 *    and scroll INSIDE itself, so the code, the CTA and the header are always on screen. This
 *    is what a shared screen and a phone in someone's hand both need: no scrolling to find the
 *    button.
 *  - `height="scroll"` → the page may grow past the viewport. Only for genuinely long content
 *    where scrolling is expected and fine (the game catalogue).
 *
 * `width` caps the content column: `md` for single-purpose forms (join), `xl` for a game board,
 * `full` for the shared-screen lobby that wants the whole TV.
 */
type ScreenWidth = 'md' | 'lg' | 'xl' | 'full';
type ScreenHeight = 'fit' | 'scroll';

const WIDTH: Record<ScreenWidth, string> = {
    md: 'max-w-md',
    lg: 'max-w-2xl',
    xl: 'max-w-5xl',
    full: 'max-w-6xl',
};

const HEIGHT: Record<ScreenHeight, string> = {
    // `h-dvh` (not `min-h-screen`) so mobile browser chrome shrinking the viewport shrinks the
    // layout with it, instead of pushing the CTA under the address bar.
    fit: 'h-dvh overflow-hidden',
    scroll: 'min-h-dvh',
};

export function Screen({
    children,
    width = 'full',
    height = 'fit',
    className,
}: {
    children: ReactNode;
    width?: ScreenWidth;
    height?: ScreenHeight;
    className?: string;
}) {
    return (
        <main
            className={ClassnameHelper.join(
                'mx-auto flex w-full flex-col px-5 sm:px-6',
                // Respect the notch/home-indicator so nothing sits under them on a phone.
                'pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))]',
                WIDTH[width],
                HEIGHT[height],
                className,
            )}
        >
            {children}
        </main>
    );
}
