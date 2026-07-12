'use client';

import { PrimaryButton } from '@/platform/ui/Button';
import { Button } from '@heroui/react';
import Link from 'next/link';
import { useEffect } from 'react';
import { BiErrorCircle, BiHome, BiRefresh } from 'react-icons/bi';

/**
 * Root error boundary — catches render/runtime errors anywhere in the app and
 * offers a recoverable UI instead of a blank screen. Rendered inside the root
 * layout, so the themed background is preserved.
 */
export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-400/15 text-rose-400">
                <BiErrorCircle size={34} aria-hidden="true" />
            </span>
            <div className="flex flex-col gap-1.5">
                <h1 className="text-2xl font-bold text-white">Algo ha ido mal</h1>
                <p className="max-w-sm text-sm leading-relaxed text-gray-400">
                    Ha ocurrido un error inesperado. Puedes reintentar o volver al inicio.
                </p>
            </div>
            <div className="flex w-full max-w-xs flex-col gap-2.5">
                <PrimaryButton
                    className="w-full"
                    startContent={<BiRefresh size={20} />}
                    onPress={reset}
                >
                    Reintentar
                </PrimaryButton>
                <Button
                    as={Link}
                    href="/"
                    size="lg"
                    variant="bordered"
                    className="w-full border-white/20 text-white"
                    startContent={<BiHome size={20} />}
                >
                    Inicio
                </Button>
            </div>
        </div>
    );
}
