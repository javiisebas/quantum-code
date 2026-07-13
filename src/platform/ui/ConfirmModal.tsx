'use client';

import { Button } from '@/platform/ui/Button';
import { useModal } from '@/platform/ui/modal-context';
import { ModalBody, ModalFooter, ModalHeader } from '@heroui/react';
import { FC, ReactNode } from 'react';

interface ConfirmModalProps {
    title: string;
    message: ReactNode;
    confirmLabel: string;
    onConfirm: () => void;
    confirmIcon?: ReactNode;
    cancelLabel?: string;
    /** Style the confirm action as destructive (red) — for irreversible actions. */
    destructive?: boolean;
}

/**
 * Shared confirmation modal. One component so every confirm dialog has an identical footer: both
 * buttons the same size, the same alignment, and — since "cancelar" is simply the alternative to
 * the confirm — the same `secondary` treatment every other alternative in the arcade gets. It was
 * a `ghost` text link, which made a modal's two options look like two different kinds of thing.
 */
export const ConfirmModal: FC<ConfirmModalProps> = ({
    title,
    message,
    confirmLabel,
    onConfirm,
    confirmIcon,
    cancelLabel = 'Cancelar',
    destructive = false,
}) => {
    const { closeModal } = useModal();

    return (
        <div>
            <ModalHeader className="text-lg font-bold text-white">{title}</ModalHeader>
            <ModalBody>
                <p className="text-sm leading-relaxed text-gray-300">{message}</p>
            </ModalBody>
            <ModalFooter className="gap-2">
                <Button variant="secondary" onPress={closeModal}>
                    {cancelLabel}
                </Button>
                <Button
                    variant={destructive ? 'danger' : 'primary'}
                    startContent={confirmIcon}
                    onPress={() => {
                        onConfirm();
                        closeModal();
                    }}
                >
                    {confirmLabel}
                </Button>
            </ModalFooter>
        </div>
    );
};
