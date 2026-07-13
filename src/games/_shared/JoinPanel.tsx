'use client';

import { gameManifests } from '@/games/registry';
import { Button } from '@/platform/ui/Button';
import { CodeInput } from '@/platform/ui/CodeInput';
import { Eyebrow } from '@/platform/ui/Eyebrow';
import { QrScannerOverlay } from '@/platform/ui/QrScannerOverlay';
import { ClassnameHelper } from '@/platform/util/classnames';
import { useState } from 'react';
import { BiQr } from 'react-icons/bi';
import { useJoinFlow } from './use-join-flow';

/**
 * The reusable "pick a game + enter the code" form body — used by the generic
 * `/join` page. Renders ONLY the fields and actions (game picker → code → scan/join);
 * the caller supplies the outer `Surface` card and heading so it drops into any panel
 * unchanged. Scanning a QR resolves its own game via `parseJoinTarget`, so a scan can
 * override the picked game when the code lives on a different game's link.
 */
export function JoinPanel({
    autoFocus = false,
    className,
}: {
    autoFocus?: boolean;
    className?: string;
}) {
    // The picked game is local (it drives the picker UI); the code/scan flow around it
    // is shared with `JoinForm` via `useJoinFlow`, keyed on the current pick.
    const [gameId, setGameId] = useState(gameManifests[0]?.id ?? '');
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
    } = useJoinFlow(gameId);

    return (
        <div className={ClassnameHelper.join('flex flex-col gap-5', className)}>
            <fieldset className="flex flex-col gap-2">
                <Eyebrow as="legend">Juego</Eyebrow>
                <div className="flex flex-wrap gap-2">
                    {gameManifests.map((game) => {
                        const selected = game.id === gameId;
                        return (
                            <button
                                key={game.id}
                                type="button"
                                aria-pressed={selected}
                                onClick={() => setGameId(game.id)}
                                className={ClassnameHelper.join(
                                    'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ring-1 transition',
                                    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-500',
                                    selected
                                        ? 'bg-purple-600 text-white ring-purple-400'
                                        : 'bg-white/5 text-gray-300 ring-inset ring-white/10 hover:bg-white/10',
                                )}
                            >
                                <span aria-hidden="true">{game.emoji}</span>
                                {game.name}
                            </button>
                        );
                    })}
                </div>
            </fieldset>

            <CodeInput
                value={code}
                onChange={handleCode}
                onComplete={submitIfValid}
                autoFocus={autoFocus}
            />

            <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                    variant="secondary"
                    fullWidth
                    startContent={<BiQr size={20} />}
                    onPress={openScanner}
                >
                    Escanear QR
                </Button>
                <Button variant="primary" fullWidth isDisabled={!valid} onPress={submit}>
                    Unirse
                </Button>
            </div>

            {scanError && (
                <p className="text-center text-sm text-rose-300" role="alert">
                    QR no válido. Inténtalo de nuevo.
                </p>
            )}

            {scanning && <QrScannerOverlay onDetect={handleDetect} onClose={closeScanner} />}
        </div>
    );
}
