'use client';

import { Button } from '@/platform/ui/Button';
import { CodeInput } from '@/platform/ui/CodeInput';
import { QrScannerOverlay } from '@/platform/ui/QrScannerOverlay';
import { Surface } from '@/platform/ui/Surface';
import { FC } from 'react';
import { BiQr } from 'react-icons/bi';
import { useJoinFlow } from './use-join-flow';

/**
 * Shared "enter the code" panel for a single game's player view — the empty state
 * every phone shows when it arrives without a valid code. The game is already fixed
 * (this phone is on `/join/<game>`), so there's no picker: just the code, a QR scanner
 * and Join. One component so every game's join screen looks identical (the generic
 * `/join` page layers a game picker on top of the same visual language).
 */
export const JoinForm: FC<{ game: string; gameName: string }> = ({ game, gameName }) => {
    const {
        code,
        scanning,
        scanError,
        valid,
        handleCode,
        handleDetect,
        submit,
        submitIfValid,
        openScanner,
        closeScanner,
    } = useJoinFlow(game);

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
                    <Button variant="primary" fullWidth isDisabled={!valid} onPress={submit}>
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
            {scanning && <QrScannerOverlay onDetect={handleDetect} onClose={closeScanner} />}
        </main>
    );
};
