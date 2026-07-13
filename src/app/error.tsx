'use client';

import { Button } from '@/platform/ui/Button';
import { Screen, ScreenBody } from '@/platform/ui/Screen';
import { Surface } from '@/platform/ui/Surface';
import Link from 'next/link';
import { useEffect } from 'react';
import { BiErrorCircle, BiHome, BiRefresh } from 'react-icons/bi';

/**
 * Root error boundary — catches render/runtime errors anywhere in the app and
 * offers a recoverable UI instead of a blank screen. Rendered inside the root
 * layout, so the themed background is preserved.
 *
 * Same shell as every other dead end in the arcade (`RoomError`, `not-found`): the one
 * `<Screen>`, the one `card` column, no `<TopBar>` — its exits are its content.
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
        <Screen>
            <ScreenBody>
                <Surface className="flex w-full flex-col items-center gap-6 p-8 text-center">
                    <span className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-400/15 text-rose-400">
                        <BiErrorCircle size={34} aria-hidden="true" />
                    </span>
                    <div className="flex flex-col gap-1.5">
                        <h1 className="text-2xl font-bold text-white">Algo ha ido mal</h1>
                        <p className="text-sm leading-relaxed text-gray-400">
                            Ha ocurrido un error inesperado. Puedes reintentar o volver al inicio.
                        </p>
                    </div>
                    <div className="flex w-full flex-col gap-2.5">
                        <Button
                            variant="primary"
                            fullWidth
                            startContent={<BiRefresh size={20} />}
                            onPress={reset}
                        >
                            Reintentar
                        </Button>
                        <Button
                            variant="secondary"
                            as={Link}
                            href="/"
                            fullWidth
                            startContent={<BiHome size={20} />}
                        >
                            Inicio
                        </Button>
                    </div>
                </Surface>
            </ScreenBody>
        </Screen>
    );
}
