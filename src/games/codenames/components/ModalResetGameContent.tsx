import { PrimaryButton } from '@/platform/ui/Button';
import { useModal } from '@/platform/ui/modal-context';
import { Button, ModalBody, ModalFooter, ModalHeader } from '@heroui/react';
import { FC } from 'react';

interface ModalResetGameContentProps {
    resetGame: () => void;
}

export const ModalResetGameContent: FC<ModalResetGameContentProps> = ({ resetGame }) => {
    const { closeModal } = useModal();

    return (
        <div>
            <ModalHeader className="flex flex-col gap-1">Nueva partida</ModalHeader>
            <ModalBody>
                <p>
                    ¿Seguro que quieres empezar una partida nueva? Se generará un código nuevo y se
                    perderá la partida actual.
                </p>
            </ModalBody>
            <ModalFooter>
                <Button color="danger" variant="light" onPress={() => closeModal()}>
                    Cancelar
                </Button>
                <PrimaryButton
                    className="w-full md:w-fit"
                    onPress={() => {
                        resetGame();
                        closeModal();
                    }}
                >
                    Empezar de nuevo
                </PrimaryButton>
            </ModalFooter>
        </div>
    );
};
