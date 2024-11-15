import { ModalProvider } from '@/contexts/ModalContext';
import { NextUIProvider } from '@nextui-org/react';

export function RootProviders({ children }: { children: React.ReactNode }) {
    return (
        <NextUIProvider>
            <ModalProvider>{children}</ModalProvider>
        </NextUIProvider>
    );
}
