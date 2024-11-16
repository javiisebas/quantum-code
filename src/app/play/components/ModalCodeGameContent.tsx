'use client';

import { useModal } from '@/contexts/ModalContext';
import { ModalBody, ModalHeader, Snippet } from '@nextui-org/react';
import { FC } from 'react';

interface ModalCodeGameContentProps {
    code: number;
}

export const ModalCodeGameContent: FC<ModalCodeGameContentProps> = ({ code }) => {
    const { closeModal } = useModal();

    const strCode = String(code);
    const strCodeHead = strCode.slice(0, strCode.length / 2);
    const strCodeTail = strCode.slice(strCode.length / 2, strCode.length);

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
