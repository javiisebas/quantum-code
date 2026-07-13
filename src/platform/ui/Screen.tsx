import { ClassnameHelper } from '@/platform/util/classnames';
import { ReactNode } from 'react';

/**
 * The page shell every screen in the arcade sits in — and the ONE layout rhythm they all obey.
 *
 * Before this, every screen picked its own content width, its own padding and its own idea of
 * where the title went, so walking from the home page into a game felt like walking into a
 * different app: the catalogue was a 1024px column, the lobby a 1152px one, the phone stage a
 * 448px one — and only some of them had a header at all. That is the bug this file fixes, and
 * the rhythm below is the fix. Four rules:
 *
 *  1. ONE PAGE WIDTH. The page is always the same rail — `max-w-6xl`, `px-5 sm:px-6` — so the
 *     CHROME spans it and never moves between screens. There is deliberately NO `width` prop:
 *     a top bar squeezed into a 448px column in the middle of a laptop is not chrome, it's
 *     debris. What gets capped is the CONTENT column INSIDE the page — see `<ScreenBody>`.
 *
 *  2. ONE CONTENT SCALE, and it lives on the body, not on the page:
 *       · `card`  (max-w-md)  → the one-card screens: join, name, player count, a secret card,
 *                               an error, a wait. Every card in the arcade is the same width.
 *       · `stage` (max-w-2xl) → a live game's board on the shared screen.
 *       · no body at all      → the screens that want the whole rail and lay their own grid out
 *                               in it: the lobby's two-up split, the catalogue.
 *
 *  3. ONE VERTICAL RHYTHM. `<ScreenBody>` owns it (`py-4 short:py-2`, safe-centred) and it is
 *     the ONE scroll box on the page. A screen's own inter-block gaps stay with the screen.
 *
 *  4. THE TITLE LIVES IN `<TopBar>`. Every screen opens with one, at the same height, in the
 *     same corner, carrying the same three things: the way out, the identity of what you are
 *     looking at, and this screen's one action.
 *
 * Two HEIGHT contracts, and the choice is the whole point:
 *
 *  - `height="fit"` (default) → the page is EXACTLY one viewport tall (`h-dvh`) and never
 *    scrolls. Anything that can overflow (a long roster, a board, a card plus its reference
 *    list) must claim `flex-1 min-h-0` and scroll INSIDE itself, so the code, the CTA and the
 *    header are always on screen. This is what a shared screen and a phone in someone's hand
 *    both need: no scrolling to find the button.
 *  - `height="scroll"` → the page may grow past the viewport. The catalogue, and nothing else.
 *
 * Deliberately outside the rhythm, both justified in place: the Codenames board owns the whole
 * viewport (it is a board, not a page) and carries its chrome as floating docks; and waits
 * (`Loading`) / dead ends (`RoomError`) carry no `TopBar`, because their exits ARE their content.
 */
type ScreenHeight = 'fit' | 'scroll';

const HEIGHT: Record<ScreenHeight, string> = {
    // `h-dvh` (not `min-h-screen`) so mobile browser chrome shrinking the viewport shrinks the
    // layout with it, instead of pushing the CTA under the address bar.
    fit: 'h-dvh overflow-hidden',
    scroll: 'min-h-dvh',
};

export function Screen({
    children,
    height = 'fit',
    className,
}: {
    children: ReactNode;
    height?: ScreenHeight;
    className?: string;
}) {
    return (
        <main
            className={ClassnameHelper.join(
                // Rule 1: the one rail. Every screen's chrome starts and ends on the same x.
                'mx-auto flex w-full max-w-6xl flex-col px-5 sm:px-6',
                // Respect the notch/home-indicator so nothing sits under them on a phone.
                'pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))]',
                HEIGHT[height],
                className,
            )}
        >
            {children}
        </main>
    );
}

/** Rule 2: the content scale. Two widths, because there are two kinds of content. */
type BodyWidth = 'card' | 'stage';

const BODY_WIDTH: Record<BodyWidth, string> = {
    card: 'max-w-md',
    stage: 'max-w-2xl',
};

/**
 * Everything under the `<TopBar>` on a `height="fit"` screen: the capped, centred content column
 * — and the ONE thing on the page that is allowed to scroll.
 *
 * It exists because six screens had each hand-rolled the same
 * `flex min-h-0 flex-1 flex-col items-center …` and then drifted: one centred and one didn't,
 * one shrank its padding on a short phone and one didn't, and two of the three that could
 * overflow remembered `safe center` while the others would have stranded their own first row
 * out of the top of the scroll box, where it can never be scrolled back to. Making the safe
 * variant the DEFAULT is what makes that class of bug unwritable.
 *
 * Not for `height="scroll"` screens: there, the page itself is the scroll box.
 */
export function ScreenBody({
    children,
    width = 'card',
    className,
}: {
    children: ReactNode;
    width?: BodyWidth;
    className?: string;
}) {
    return (
        <div
            className={ClassnameHelper.join(
                'mx-auto flex min-h-0 w-full flex-1 flex-col items-center overflow-y-auto',
                // Rule 3: the one vertical rhythm — and it gives way before the content does on
                // an SE-sized phone (`short:`, a max-height breakpoint).
                'py-4 short:py-2',
                // Never plain centring on a scroll box: `safe` degrades to `start` the moment the
                // content overflows, so an overflowing stage stays scrollable to its first row.
                '[justify-content:safe_center]',
                BODY_WIDTH[width],
                className,
            )}
        >
            {children}
        </div>
    );
}
