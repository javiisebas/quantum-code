'use client';

import { useJoinFlow, type JoinError } from '@/platform/room/use-join-flow';
import { Button } from '@/platform/ui/Button';
import { CodeInput } from '@/platform/ui/CodeInput';
import { QrScannerOverlay } from '@/platform/ui/QrScannerOverlay';
import { Screen } from '@/platform/ui/Screen';
import { Surface } from '@/platform/ui/Surface';
import { TopBar } from '@/platform/ui/TopBar';
import { ClassnameHelper } from '@/platform/util/classnames';
import { Spinner } from '@heroui/react';
import { BiQr } from 'react-icons/bi';

/**
 * The player's way in — one screen, one job, no scrolling.
 *
 * What it replaces: a join CARD wedged between a marketing hero and the game catalogue on the
 * home page, holding a picker of all eight games. The picker was there because a code used to
 * be meaningless without knowing its game — but that made the player answer a question only the
 * server can answer, and answering it WRONG (the picker defaulted to Código Secreto) dumped them
 * in an empty form for a game nobody was playing. Codes are now unique across the arcade, so the
 * question is gone, and what's left is exactly two ways in: scan, or type.
 */
const MESSAGES: Record<JoinError, string> = {
    unknown: 'No hay ninguna partida con ese código. Comprueba los dígitos con el anfitrión.',
    scan: 'Ese QR no es de una partida. Prueba a apuntar de nuevo.',
    network: 'No hemos podido conectar. Inténtalo otra vez.',
};

export function JoinScreen({
    initialCode = '',
    initialError = null,
}: {
    /** Pre-filled digits — a scanned link whose room is gone comes back here with them. */
    initialCode?: string;
    initialError?: JoinError | null;
}) {
    const {
        code,
        scanning,
        error,
        resolving,
        valid,
        handleCode,
        handleDetect,
        submit,
        submitIfValid,
        openScanner,
        closeScanner,
    } = useJoinFlow(initialCode, initialError);

    return (
        // Full-width page so the chrome spans it; the card is what's capped narrow.
        <Screen width="full" height="fit">
            <TopBar variant="back" backLabel="Volver al inicio" />

            <div className="flex min-h-0 flex-1 flex-col items-center justify-center py-4">
                <Surface className="flex w-full max-w-md flex-col gap-6 p-6 sm:p-8">
                    <h1 className="text-center text-2xl font-bold text-white">
                        Únete a la partida
                    </h1>

                    <div className="flex flex-col gap-3">
                        <CodeInput
                            value={code}
                            onChange={handleCode}
                            onComplete={submitIfValid}
                            autoFocus
                        />

                        {/*
                         * ONE line that is always occupied: the hint when all is well, the reason
                         * when it isn't. Reserving an empty 40px slot for an error that may never
                         * come reads as a hole in the card; letting the error push the buttons down
                         * makes them move under the thumb. This does neither.
                         */}
                        <p
                            role="alert"
                            aria-live="polite"
                            className={ClassnameHelper.join(
                                'min-h-[2.5rem] text-center text-sm leading-snug',
                                error ? 'text-rose-300' : 'text-gray-400',
                            )}
                        >
                            {error
                                ? MESSAGES[error]
                                : 'El anfitrión lo tiene en la pantalla compartida.'}
                        </p>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Button
                            variant="primary"
                            fullWidth
                            isDisabled={!valid || resolving}
                            onPress={submit}
                            startContent={
                                resolving ? <Spinner size="sm" color="current" /> : undefined
                            }
                        >
                            {resolving ? 'Buscando la partida…' : 'Unirse'}
                        </Button>
                        <Button
                            variant="secondary"
                            fullWidth
                            startContent={<BiQr size={20} />}
                            onPress={openScanner}
                            isDisabled={resolving}
                        >
                            Escanear QR
                        </Button>
                    </div>
                </Surface>
            </div>

            {scanning && <QrScannerOverlay onDetect={handleDetect} onClose={closeScanner} />}
        </Screen>
    );
}
