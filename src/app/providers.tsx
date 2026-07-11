import { ModalProvider } from '@/contexts/ModalContext';
import { HeroUIProvider } from '@heroui/react';

export function RootProviders({ children }: { children: React.ReactNode }) {
    return (
        <HeroUIProvider>
            <ModalProvider>{children}</ModalProvider>
        </HeroUIProvider>
    );
}
