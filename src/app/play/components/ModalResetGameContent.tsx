import { useModal } from '@/contexts/ModalContext';
import { Button, ModalBody, ModalFooter, ModalHeader } from '@nextui-org/react';
import { FC } from 'react';

interface ModalResetGameContentProps {
    resetGame: () => void;
}

export const ModalResetGameContent: FC<ModalResetGameContentProps> = ({ resetGame }) => {
    const { closeModal } = useModal();

    return (
        <div>
            <ModalHeader className="flex flex-col gap-1">Confirm Reset</ModalHeader>
            <ModalBody>
                <p>Are you sure you want to reset the game? This action cannot be undone.</p>
            </ModalBody>
            <ModalFooter>
                <Button color="danger" variant="light" onPress={() => closeModal()}>
                    Cancel
                </Button>
                <Button
                    className="w-full md:w-fit bg-purple-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-purple-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-700"
                    onPress={() => {
                        resetGame();
                        closeModal();
                    }}
                >
                    Confirm
                </Button>
            </ModalFooter>
        </div>
    );
};
