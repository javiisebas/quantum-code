'use client';

import { useModal } from '@/contexts/ModalContext';
import { Modal, ModalContent } from '@heroui/react';

export default function ModalComponent() {
    const { isOpen, closeModal, modalContent } = useModal();

    return (
        <Modal backdrop="opaque" isOpen={isOpen} onClose={closeModal}>
            <ModalContent className="bg-gray-900">{modalContent}</ModalContent>
        </Modal>
    );
}
