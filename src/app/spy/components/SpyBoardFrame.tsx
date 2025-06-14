import { ChildrenProps } from '@/types/children.type';
import { FC } from 'react';
import { SpyBoardMenu } from './SpyBoardMenu';

export const SpyBoardFrame: FC<ChildrenProps> = ({ children }) => {
    return (
        <div className="relative overflow-hidden min-h-screen flex items-center justify-center">
            {children}

            <div className="absolute left-1/2 bottom-10 -translate-x-1/2">
                <SpyBoardMenu />
            </div>
        </div>
    );
};
