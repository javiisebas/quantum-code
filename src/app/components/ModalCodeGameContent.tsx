import { useModal } from '@/contexts/ModalContext';
import { Button, Code, ModalBody, ModalFooter, ModalHeader } from '@nextui-org/react';
import { FC } from 'react';

export const ModalCodeGameContent: FC = () => {
    const { closeModal } = useModal();

    return (
        <div>
            <ModalHeader className="flex flex-col gap-1">Game Code</ModalHeader>
            <ModalBody>
                <Code size="lg" className="py-3">
                    <p className="text-4xl text-center">
                        <span>123</span>
                        <span className="text-gray-500/30">·</span>
                        <span>456</span>
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
