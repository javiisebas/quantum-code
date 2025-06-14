import { useModal } from '@/contexts/ModalContext';
import { Button, ModalBody, ModalFooter, ModalHeader } from '@nextui-org/react';
import { FC } from 'react';

interface ModalRevealCardsGameContentProps {
    revealAll: () => void;
}

export const ModalRevealCardsGameContent: FC<ModalRevealCardsGameContentProps> = ({
    revealAll,
}) => {
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
                    className="w-full md:w-fit bg-purple-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-purple-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-700"
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
