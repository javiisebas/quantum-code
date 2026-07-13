'use client';

import { Button } from '@/platform/ui/Button';
import { Screen, ScreenBody } from '@/platform/ui/Screen';
import { Surface } from '@/platform/ui/Surface';
import Link from 'next/link';
import { ReactNode } from 'react';
import { BiHome, BiRefresh } from 'react-icons/bi';

/**
 * The one "this room didn't work out" state: the room couldn't be created, the code is dead,
 * the game is full. Every one of those used to be a bare centred `<p>` with a lone button,
 * hand-rolled per game — so the same failure looked different depending on where you hit it.
 *
 * It always offers a way forward (retry, or home): a dead end with no exit is the one thing a
 * party game can't afford, because the person staring at it is standing in a room full of
 * people waiting to play.
 *
 * Same `<Screen>` and same `card` column as every other one-card screen — but deliberately NO
 * `<TopBar>`: this screen's whole content IS its exits, and a home key in the corner competing
 * with the "Volver al inicio" button two inches below it is one exit too many.
 */
export function RoomError({
    title = 'Vaya…',
    message,
    onRetry,
    children,
}: {
    title?: string;
    message: ReactNode;
    /** When given, offers a retry alongside the way home. */
    onRetry?: () => void;
    children?: ReactNode;
}) {
    return (
        <Screen>
            <ScreenBody>
                <Surface className="flex w-full flex-col items-center gap-5 p-8 text-center">
                    <span className="text-5xl" aria-hidden="true">
                        🤷
                    </span>
                    <div className="flex flex-col gap-2">
                        <h1 className="text-xl font-bold text-white">{title}</h1>
                        <p className="text-sm leading-relaxed text-gray-400">{message}</p>
                    </div>
                    {children}
                    <div className="flex w-full flex-col gap-2">
                        {onRetry && (
                            <Button
                                variant="primary"
                                fullWidth
                                startContent={<BiRefresh size={20} />}
                                onPress={onRetry}
                            >
                                Reintentar
                            </Button>
                        )}
                        {/* Retrying is the primary when it is on offer, and going home is its
                            alternative. With no retry, going home is the only action left on the
                            screen — so it becomes the primary. A screen never offers nothing but
                            alternatives. */}
                        <Button
                            variant={onRetry ? 'secondary' : 'primary'}
                            fullWidth
                            as={Link}
                            href="/"
                            startContent={<BiHome size={20} />}
                        >
                            Volver al inicio
                        </Button>
                    </div>
                </Surface>
            </ScreenBody>
        </Screen>
    );
}
