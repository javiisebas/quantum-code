'use client';

import { PrimaryButton } from '@/platform/ui/Button';
import { Button, ModalBody, ModalHeader } from '@heroui/react';
import { QRCodeSVG } from 'qrcode.react';
import { FC, useEffect, useMemo, useState } from 'react';
import { BiCheck, BiCopy, BiShareAlt } from 'react-icons/bi';

interface ShareModalProps {
    /** The join code players type or scan. */
    code: number;
    /** Game id — used to build the `/join/<game>?code=…` link. */
    game: string;
    /** Display name of the game (used in the native-share text). */
    gameName: string;
}

/**
 * Generic "share the room" modal reused by every game's host screen. Players join by
 * scanning the QR (which encodes the full `/join/<game>?code=…` URL) or by typing the
 * code, so we surface both the scannable QR and the plain code, plus copy/native-share
 * shortcuts for the join link.
 */
export const ShareModal: FC<ShareModalProps> = ({ code, game, gameName }) => {
    // `origin` is only known on the client; compute it after mount to keep the QR/link
    // stable and avoid any server/client hydration divergence.
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
            // Clipboard unavailable (e.g. insecure context) — the code stays visible to type.
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

    return (
        <div>
            <ModalHeader className="flex flex-col gap-1">Comparte la partida</ModalHeader>
            <ModalBody className="items-center gap-5 pb-8">
                <p className="text-center text-sm text-gray-300">
                    Escanea el QR o entra en <span className="font-semibold">/join</span> e introduce
                    el código.
                </p>

                {joinUrl ? (
                    <div className="rounded-2xl bg-white p-4 shadow-lg">
                        <QRCodeSVG
                            value={joinUrl}
                            size={200}
                            level="M"
                            marginSize={0}
                            bgColor="#ffffff"
                            fgColor="#111827"
                            aria-label={`Código QR para unirse a la partida ${code}`}
                        />
                    </div>
                ) : (
                    <div className="h-[232px] w-[232px] animate-pulse rounded-2xl bg-white/10" />
                )}

                <div className="flex flex-col items-center gap-1">
                    <span className="text-xs uppercase tracking-widest text-gray-400">Código</span>
                    <span className="font-mono text-4xl font-bold tracking-[0.2em] text-white">
                        {code}
                    </span>
                </div>

                <div className="flex w-full flex-col gap-2 sm:flex-row">
                    <Button
                        size="lg"
                        variant="bordered"
                        className="w-full border-gray-100/20 text-white"
                        startContent={copied ? <BiCheck size={18} /> : <BiCopy size={18} />}
                        onPress={handleCopy}
                        isDisabled={!joinUrl}
                    >
                        {copied ? '¡Copiado!' : 'Copiar enlace'}
                    </Button>
                    {canShare && (
                        <PrimaryButton
                            className="w-full"
                            startContent={<BiShareAlt size={18} />}
                            onPress={handleShare}
                            isDisabled={!joinUrl}
                        >
                            Compartir
                        </PrimaryButton>
                    )}
                </div>
            </ModalBody>
        </div>
    );
};
