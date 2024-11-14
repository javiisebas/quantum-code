import { GameProvider } from '@/contexts/GameContext';
import { ModalProvider } from '@/contexts/ModalContext';
import { NextUIProvider } from '@nextui-org/react';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <NextUIProvider>
            <ModalProvider>
                <GameProvider>{children}</GameProvider>
            </ModalProvider>
        </NextUIProvider>
    );
}
