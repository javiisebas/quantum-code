'use client';

import { ModalBody, ModalHeader, Snippet } from '@nextui-org/react';
import { FC } from 'react';

interface ModalCodeGameContentProps {
    code: number;
}

export const ModalCodeGameContent: FC<ModalCodeGameContentProps> = ({ code }) => {
    return (
        <div>
            <ModalHeader className="flex flex-col gap-1">Game Code</ModalHeader>
            <ModalBody className="pb-10">
                <Snippet symbol="" variant="bordered" className="text-4xl text-center gap-2">
                    {code}
                </Snippet>
            </ModalBody>
        </div>
    );
};
