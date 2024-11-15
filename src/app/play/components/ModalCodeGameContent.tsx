'use client';

import { useGame } from '@/contexts/GameContext';
import { useModal } from '@/contexts/ModalContext';
import { Button, Code, ModalBody, ModalFooter, ModalHeader } from '@nextui-org/react';
import { FC } from 'react';

export const ModalCodeGameContent: FC = () => {
    const { code } = useGame();
    const { closeModal } = useModal();

    const strCode = String(code);
    const strCodeHead = strCode.slice(0, strCode.length / 2);
    const strCodeTail = strCode.slice(strCode.length / 2, strCode.length);

    return (
        <div>
            <ModalHeader className="flex flex-col gap-1">Game Code</ModalHeader>
            <ModalBody>
                <Code size="lg" className="py-3">
                    <p className="text-4xl text-center">
                        <span>{strCodeHead}</span>
                        <span className="text-gray-500/30">·</span>
                        <span>{strCodeTail}</span>
                    </p>
                </Code>
            </ModalBody>
            <ModalFooter>
                <Button color="danger" variant="light" onPress={() => closeModal()}>
                    Cancel
                </Button>
                <Button color="primary" onPress={() => closeModal()}>
                    Confirm
                </Button>
            </ModalFooter>
        </div>
    );
};
