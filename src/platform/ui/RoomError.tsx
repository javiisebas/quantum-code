'use client';

import { Button } from '@/platform/ui/Button';
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
        <div className="flex h-dvh items-center justify-center px-5">
            <Surface className="flex w-full max-w-sm flex-col items-center gap-5 p-8 text-center">
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
                    <Button
                        variant="secondary"
                        fullWidth
                        as={Link}
                        href="/"
                        startContent={<BiHome size={20} />}
                    >
                        Volver al inicio
                    </Button>
                </div>
            </Surface>
        </div>
    );
}
