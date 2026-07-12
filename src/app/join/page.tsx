'use client';

import { JoinPanel } from '@/games/_shared/JoinPanel';
import { Surface } from '@/platform/ui/Surface';

/**
 * Generic join screen for players who did not scan a QR: pick the game the host
 * chose, type the 6-digit code (or scan the QR), and land on that game's player view.
 * Scanning the host QR from the camera skips this entirely and goes straight to
 * `/join/<game>?code=…`. Arriving here with no code simply shows a blank form.
 */
export default function JoinPage() {
    return (
        <main className="flex min-h-screen items-center justify-center px-6 py-12">
            <Surface as="section" className="w-full max-w-md p-8">
                <h1 className="text-2xl font-bold text-white">Unirse a una partida</h1>
                <p className="mt-2 text-sm text-gray-400">
                    Elige el juego e introduce el código que ve el anfitrión.
                </p>
                <div className="mt-6">
                    <JoinPanel autoFocus />
                </div>
            </Surface>
        </main>
    );
}
