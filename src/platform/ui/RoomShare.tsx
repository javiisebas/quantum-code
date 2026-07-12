'use client';

import { Button } from '@/platform/ui/Button';
import { CodeDisplay } from '@/platform/ui/CodeDisplay';
import { QRCodeSVG } from 'qrcode.react';
import { FC, useEffect, useMemo, useState } from 'react';
import { BiCheck, BiCopy, BiShareAlt } from 'react-icons/bi';

interface RoomShareProps {
    /** The join code players type or scan. */
    code: number;
    /** Game id — used to build the `/join/<game>?code=…` link. */
    game: string;
    /** Display name of the game (used in the native-share text). */
    gameName: string;
    /** QR pixel size. */
    qrSize?: number;
    codeSize?: 'lg' | 'md';
}

/**
 * The single "share this room" surface: scannable QR + big code + copy-link and
 * native-share shortcuts, with copy that clearly says the QR is scanned with the
 * phone camera. Reused by the codenames share modal AND inlined in every per-player
 * host lobby, so there is exactly one share experience across the arcade (it replaced
 * two near-identical copies that had drifted, one still branded "Quantum Code").
 */
export const RoomShare: FC<RoomShareProps> = ({
    code,
    game,
    gameName,
    qrSize = 200,
    codeSize = 'lg',
}) => {
    // `origin` is only known on the client; compute it after mount so the QR/link stay
    // stable and never cause a server/client hydration mismatch.
    const [origin, setOrigin] = useState('');
    const [canShare, setCanShare] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        setOrigin(window.location.origin);
        setCanShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function');
    }, []);

    const joinUrl = useMemo(
        () => (origin ? `${origin}/join/${game}?code=${code}` : ''),
        [origin, game, code],
    );

    const handleCopy = async () => {
        if (!joinUrl) return;
        try {
            await navigator.clipboard.writeText(joinUrl);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
        } catch {
            // Clipboard blocked (e.g. insecure context) — the code stays visible to type.
        }
    };

    const handleShare = async () => {
        if (!joinUrl) return;
        try {
            await navigator.share({
                title: gameName,
                text: `Únete a mi partida de ${gameName} con el código ${code}`,
                url: joinUrl,
            });
        } catch {
            // The user dismissed the share sheet — nothing to do.
        }
    };

    const boxSize = qrSize + 32; // p-4 padding on each side

    return (
        <div className="flex w-full flex-col items-center gap-5">
            {joinUrl ? (
                <div className="rounded-2xl bg-white p-4 shadow-lg shadow-black/20">
                    <QRCodeSVG
                        value={joinUrl}
                        size={qrSize}
                        level="M"
                        marginSize={0}
                        bgColor="#ffffff"
                        fgColor="#111827"
                        aria-label={`Código QR para unirse a la partida ${code}`}
                    />
                </div>
            ) : (
                <div
                    className="animate-pulse rounded-2xl bg-white/10"
                    style={{ height: boxSize, width: boxSize }}
                />
            )}

            <CodeDisplay code={code} size={codeSize} />

            <div className="flex w-full flex-col gap-2 sm:flex-row">
                <Button
                    variant="secondary"
                    fullWidth
                    startContent={copied ? <BiCheck size={18} /> : <BiCopy size={18} />}
                    onPress={handleCopy}
                    isDisabled={!joinUrl}
                >
                    {copied ? '¡Enlace copiado!' : 'Copiar enlace'}
                </Button>
                {canShare && (
                    <Button
                        variant="primary"
                        fullWidth
                        startContent={<BiShareAlt size={18} />}
                        onPress={handleShare}
                        isDisabled={!joinUrl}
                    >
                        Compartir
                    </Button>
                )}
            </div>

            <p className="text-center text-xs text-gray-400">
                Escanea el QR con la cámara de tu móvil, o entra en{' '}
                <span className="font-semibold text-gray-300">/join</span> y escribe el código.
            </p>
        </div>
    );
};
