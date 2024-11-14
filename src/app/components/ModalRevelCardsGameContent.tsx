import { useGame } from '@/contexts/GameContext';
import { useModal } from '@/contexts/ModalContext';
import { Button, ModalBody, ModalFooter, ModalHeader } from '@nextui-org/react';
import { FC } from 'react';

export const ModalRevealCardsGameContent: FC = () => {
    const { revealAll } = useGame();
    const { closeModal } = useModal();

    return (
        <div>
            <ModalHeader className="flex flex-col gap-1">Reveal All Cards</ModalHeader>
            <ModalBody>
                <p>
                    Are you sure you want to reveal all cards? This action will show all hidden
                    cards.
                </p>
            </ModalBody>
            <ModalFooter>
                <Button color="danger" variant="light" onPress={() => closeModal()}>
                    Cancel
                </Button>
                <Button
                    color="primary"
                    onPress={() => {
                        revealAll();
                        closeModal();
                    }}
                >
                    Confirm
                </Button>
            </ModalFooter>
        </div>
    );
};
