'use client';

import { parseJoinTarget } from '@/platform/room/join-target';
import { Button } from '@/platform/ui/Button';
import { CodeInput } from '@/platform/ui/CodeInput';
import { QrScannerOverlay } from '@/platform/ui/QrScannerOverlay';
import { Surface } from '@/platform/ui/Surface';
import { useRouter } from 'next/navigation';
import { FC, useState } from 'react';
import { BiQr } from 'react-icons/bi';

/**
 * Shared "enter the code" panel for a single game's player view — the empty state
 * every phone shows when it arrives without a valid code. The game is already fixed
 * (this phone is on `/join/<game>`), so there's no picker: just the code, a QR scanner
 * and Join. One component so every game's join screen looks identical (the generic
 * `/join` page layers a game picker on top of the same visual language).
 */
export const JoinForm: FC<{ game: string; gameName: string }> = ({ game, gameName }) => {
    const router = useRouter();
    const [code, setCode] = useState('');
    const [scanning, setScanning] = useState(false);
    const [scanError, setScanError] = useState(false);

    const routeTo = (targetGame: string, joinCode: number | string) =>
        router.push(`/join/${targetGame}?code=${joinCode}`);

    /** From the "Unirse" button — routes this game with the typed code. */
    const submit = () => {
        if (code.length === 6) routeTo(game, code);
    };

    /** From `CodeInput.onComplete` — the freshly-completed digits arrive as an arg. */
    const submitIfValid = (digits: string) => {
        if (digits.length === 6) routeTo(game, digits);
    };

    const handleCode = (digits: string) => {
        setScanError(false);
        setCode(digits);
    };

    const handleDetect = (text: string) => {
        const target = parseJoinTarget(text, game);
        if (target) {
            setScanning(false);
            routeTo(target.game, target.code);
        } else {
            // Keep the scanner open so the player can re-aim; surface a note underneath.
            setScanError(true);
        }
    };

    const openScanner = () => {
        setScanError(false);
        setScanning(true);
    };

    return (
        <main className="flex min-h-screen items-center justify-center px-6 py-12">
            <Surface as="section" className="w-full max-w-sm p-8 text-center">
                <h1 className="text-2xl font-bold text-white">{gameName}</h1>
                <p className="mt-2 text-sm text-gray-400">
                    Introduce el código que ve el anfitrión en la pantalla.
                </p>
                <div className="mt-6 flex flex-col gap-4">
                    <CodeInput
                        value={code}
                        onChange={handleCode}
                        onComplete={submitIfValid}
                        autoFocus
                    />
                    <Button
                        variant="primary"
                        fullWidth
                        isDisabled={code.length !== 6}
                        onPress={submit}
                    >
                        Unirse
                    </Button>
                    <Button
                        variant="secondary"
                        fullWidth
                        startContent={<BiQr size={20} />}
                        onPress={openScanner}
                    >
                        Escanear QR
                    </Button>
                    {scanError && (
                        <p className="text-sm text-rose-300" role="alert">
                            QR no válido. Inténtalo de nuevo.
                        </p>
                    )}
                </div>
            </Surface>
            {scanning && (
                <QrScannerOverlay onDetect={handleDetect} onClose={() => setScanning(false)} />
            )}
        </main>
    );
};
