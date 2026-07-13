import { ChildrenProps } from '@/platform/util/children';
import { FC } from 'react';
import { SpyBoardMenu } from './SpyBoardMenu';

/**
 * The spymaster's phone. The board half of Codenames, so it follows the BOARD's rules rather than
 * the page rhythm: it owns the viewport and wears a floating dock, exactly like the shared screen
 * it is a secret copy of. A `<TopBar>` here would spend a row of a phone's height restating a
 * board the player is already looking at.
 *
 * What it shares with every `<Screen>`: `h-dvh` (so the dock never slides under the mobile
 * address bar), the same `px-5 sm:px-6` gutter, and the same contract that the ONE scrollable
 * thing is the content — 25 word-cells do not fit a phone, and `min-h-full` + `justify-center` on
 * the inner track is what centres a short board without stranding the top of a tall one.
 */
export const SpyBoardFrame: FC<ChildrenProps> = ({ children }) => {
    return (
        <div className="relative h-dvh overflow-y-auto">
            <div className="mx-auto flex min-h-full max-w-lg flex-col justify-center px-5 pb-32 pt-8 sm:px-6">
                {children}
            </div>

            <div className="fixed bottom-8 left-1/2 z-10 -translate-x-1/2">
                <SpyBoardMenu />
            </div>
        </div>
    );
};
