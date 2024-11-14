import { useGame } from '@/contexts/GameContext';
import { useModal } from '@/contexts/ModalContext';
import { Button, ModalBody, ModalFooter, ModalHeader } from '@nextui-org/react';
import { FC } from 'react';

export const ModalResetGameContent: FC = () => {
    const { resetGame } = useGame();
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
                    color="primary"
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
