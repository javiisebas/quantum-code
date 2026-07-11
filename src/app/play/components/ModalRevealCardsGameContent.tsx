import { PrimaryButton } from '@/app/components/ui/Button';
import { useModal } from '@/contexts/ModalContext';
import { Button, ModalBody, ModalFooter, ModalHeader } from '@heroui/react';
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
                <PrimaryButton
                    className="w-full md:w-fit"
                    onPress={() => {
                        revealAll();
                        closeModal();
                    }}
                >
                    Confirm
                </PrimaryButton>
            </ModalFooter>
        </div>
    );
};
