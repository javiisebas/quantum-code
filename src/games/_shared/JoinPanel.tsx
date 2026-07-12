'use client';

import { gameManifests } from '@/games/registry';
import { parseJoinTarget } from '@/platform/room/join-target';
import { Button } from '@/platform/ui/Button';
import { CodeInput } from '@/platform/ui/CodeInput';
import { Eyebrow } from '@/platform/ui/Eyebrow';
import { QrScannerOverlay } from '@/platform/ui/QrScannerOverlay';
import { ClassnameHelper } from '@/platform/util/classnames';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { BiQr } from 'react-icons/bi';

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
    const router = useRouter();
    const [gameId, setGameId] = useState(gameManifests[0]?.id ?? '');
    const [code, setCode] = useState('');
    const [scanning, setScanning] = useState(false);
    const [scanError, setScanError] = useState(false);

    const valid = code.length === 6 && gameId !== '';

    const routeTo = (game: string, joinCode: number | string) =>
        router.push(`/join/${game}?code=${joinCode}`);

    /** From the "Unirse" button — routes the picked game with the typed code. */
    const submit = () => {
        if (valid) routeTo(gameId, code);
    };

    /** From `CodeInput.onComplete` — the freshly-completed digits arrive as an arg. */
    const submitIfValid = (digits: string) => {
        if (digits.length === 6 && gameId) routeTo(gameId, digits);
    };

    const handleCode = (digits: string) => {
        setScanError(false);
        setCode(digits);
    };

    const handleDetect = (text: string) => {
        const target = parseJoinTarget(text, gameId);
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

            {scanning && (
                <QrScannerOverlay onDetect={handleDetect} onClose={() => setScanning(false)} />
            )}
        </div>
    );
}
