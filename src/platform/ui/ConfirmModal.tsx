'use client';

import { PrimaryButton } from '@/platform/ui/Button';
import { useModal } from '@/platform/ui/modal-context';
import { Button, ModalBody, ModalFooter, ModalHeader } from '@heroui/react';
import { FC, ReactNode } from 'react';

interface ConfirmModalProps {
    title: string;
    message: ReactNode;
    confirmLabel: string;
    onConfirm: () => void;
    confirmIcon?: ReactNode;
    cancelLabel?: string;
}

/**
 * Shared confirmation modal. One component so every confirm dialog has an identical
 * footer — both buttons the SAME size (`lg`) and alignment — instead of each modal
 * hand-rolling a footer where the cancel button ended up a different size than the
 * primary action.
 */
export const ConfirmModal: FC<ConfirmModalProps> = ({
    title,
    message,
    confirmLabel,
    onConfirm,
    confirmIcon,
    cancelLabel = 'Cancelar',
}) => {
    const { closeModal } = useModal();

    return (
        <div>
            <ModalHeader className="text-lg font-bold text-white">{title}</ModalHeader>
            <ModalBody>
                <p className="text-sm leading-relaxed text-gray-300">{message}</p>
            </ModalBody>
            <ModalFooter className="gap-2">
                <Button
                    size="lg"
                    variant="light"
                    className="font-medium text-gray-300 hover:text-white"
                    onPress={closeModal}
                >
                    {cancelLabel}
                </Button>
                <PrimaryButton
                    startContent={confirmIcon}
                    onPress={() => {
                        onConfirm();
                        closeModal();
                    }}
                >
                    {confirmLabel}
                </PrimaryButton>
            </ModalFooter>
        </div>
    );
};
