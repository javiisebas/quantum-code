'use client';

import { ModalProvider } from '@/platform/ui/modal-context';
import { HeroUIProvider } from '@heroui/react';
import { MotionConfig } from 'framer-motion';

export function RootProviders({ children }: { children: React.ReactNode }) {
    return (
        <HeroUIProvider>
            {/* Honour the OS "reduce motion" setting across all Framer Motion animations. */}
            <MotionConfig reducedMotion="user">
                <ModalProvider>{children}</ModalProvider>
            </MotionConfig>
        </HeroUIProvider>
    );
}
