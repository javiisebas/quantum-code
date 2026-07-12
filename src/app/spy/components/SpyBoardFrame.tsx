import { ChildrenProps } from '@/types/children.type';
import { FC } from 'react';
import { SpyBoardMenu } from './SpyBoardMenu';

export const SpyBoardFrame: FC<ChildrenProps> = ({ children }) => {
    return (
        // Own scroll container (the document body is overflow-hidden): centers the board
        // on tall/desktop screens and scrolls vertically on mobile where 25 word-cells
        // exceed the viewport. The menu stays pinned above the scrolling content.
        <div className="relative h-screen overflow-y-auto">
            <div className="mx-auto flex min-h-full max-w-lg flex-col justify-center px-4 pb-32 pt-8">
                {children}
            </div>

            <div className="fixed bottom-8 left-1/2 z-10 -translate-x-1/2">
                <SpyBoardMenu />
            </div>
        </div>
    );
};
