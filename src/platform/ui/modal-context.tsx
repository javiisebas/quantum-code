'use client';

import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';

interface ModalContextType {
    isOpen: boolean;
    openModal: (content: ReactNode) => void;
    closeModal: () => void;
    modalContent: ReactNode;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider = ({ children }: { children: ReactNode }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [modalContent, setModalContent] = useState<ReactNode>(null);

    const openModal = useCallback((content: ReactNode) => {
        setModalContent(content);
        setIsOpen(true);
    }, []);

    const closeModal = useCallback(() => {
        setIsOpen(false);
        setModalContent(null);
    }, []);

    const value = useMemo<ModalContextType>(
        () => ({ isOpen, openModal, closeModal, modalContent }),
        [isOpen, openModal, closeModal, modalContent],
    );

    return <ModalContext.Provider value={value}>{children}</ModalContext.Provider>;
};

export const useModal = () => {
    const context = useContext(ModalContext);
    if (!context) {
        throw new Error('useModal must be used inside of ModalProvider');
    }
    return context;
};
