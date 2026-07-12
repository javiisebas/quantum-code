'use client';

import { PrimaryButton } from '@/app/components/ui/Button';
import { Button, ModalBody, ModalHeader } from '@heroui/react';
import { QRCodeSVG } from 'qrcode.react';
import { FC, useEffect, useMemo, useState } from 'react';
import { BiCheck, BiCopy, BiShareAlt } from 'react-icons/bi';

interface ModalCodeGameContentProps {
    code: number;
}

/**
 * Share modal shown to the board device. Spies join either by scanning the QR
 * (which encodes the full `/spy?code=…` URL) or by typing the code manually, so
 * we surface both the scannable QR and the plain code, plus copy/native-share
 * shortcuts for the join link.
 */
export const ModalCodeGameContent: FC<ModalCodeGameContentProps> = ({ code }) => {
    // `origin` is only known on the client; compute it after mount to keep the
    // QR/link stable and avoid any server/client hydration divergence.
    const [origin, setOrigin] = useState('');
    const [canShare, setCanShare] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        setOrigin(window.location.origin);
        setCanShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function');
    }, []);

    const joinUrl = useMemo(() => (origin ? `${origin}/spy?code=${code}` : ''), [origin, code]);

    const handleCopy = async () => {
        if (!joinUrl) return;
        try {
            await navigator.clipboard.writeText(joinUrl);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
        } catch {
            // Clipboard unavailable (e.g. insecure context) — the code stays visible to type by hand.
        }
    };

    const handleShare = async () => {
        if (!joinUrl) return;
        try {
            await navigator.share({
                title: 'Quantum Code',
                text: `Únete a mi partida con el código ${code}`,
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
                    Los espías escanean el QR o entran en <span className="font-semibold">/spy</span>{' '}
                    e introducen el código.
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
