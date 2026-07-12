import { PrimaryButton } from '@/platform/ui/Button';
import { useModal } from '@/platform/ui/modal-context';
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
            <ModalHeader className="flex flex-col gap-1">Revelar todas las cartas</ModalHeader>
            <ModalBody>
                <p>
                    ¿Seguro que quieres revelar todas las cartas? Se mostrará el color de todas las
                    palabras y la partida terminará.
                </p>
            </ModalBody>
            <ModalFooter>
                <Button color="danger" variant="light" onPress={() => closeModal()}>
                    Cancelar
                </Button>
                <PrimaryButton
                    className="w-full md:w-fit"
                    onPress={() => {
                        revealAll();
                        closeModal();
                    }}
                >
                    Revelar
                </PrimaryButton>
            </ModalFooter>
        </div>
    );
};
