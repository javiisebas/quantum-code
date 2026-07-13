'use client';

import { Button } from '@/platform/ui/Button';
import { CodeDisplay } from '@/platform/ui/CodeDisplay';
import { ClassnameHelper } from '@/platform/util/classnames';
import { QRCodeSVG } from 'qrcode.react';
import { FC, useEffect, useMemo, useState } from 'react';
import { BiCheck, BiCopy, BiShareAlt } from 'react-icons/bi';

/** Intrinsic QR resolution. The rendered size is driven by CSS (`qrClassName`), not by this. */
const QR_RESOLUTION = 256;

interface RoomShareProps {
    /** The join code players scan or type. */
    code: number;
    /** Display name of the game (used in the native-share text). */
    gameName: string;
    /**
     * Max width of the QR box, as Tailwind classes — so it can be small on a phone and large on
     * a shared screen at the same breakpoints as the layout around it (the QR is an SVG and
     * scales losslessly, so this is a pure CSS concern).
     */
    qrClassName?: string;
    className?: string;
}

/**
 * The one "how do I get in?" surface: scan the QR, **or** type the code. Both routes are shown
 * as the two halves of a single card, split by an `o`, because that composition IS the
 * instruction — which is why the paragraph that used to sit under it ("Escanea el QR con la
 * cámara de tu móvil, o entra en /join y escribe el código") is gone. Explaining a QR code to
 * someone holding a phone is noise, and it was noise that pushed the lobby past the fold.
 *
 * The QR encodes the SHORT link (`/j/<code>`) and nothing else: the server resolves the code to
 * its game, so the payload stays small (a coarser, faster-scanning QR) and the same six digits
 * work whether you scan them or read them out loud across the room.
 *
 * Copy/share are secondary here by design: they are outlined, not solid, so they never compete
 * with the screen's single primary action ("Empezar partida").
 */
export const RoomShare: FC<RoomShareProps> = ({
    code,
    gameName,
    qrClassName = 'max-w-[200px]',
    className,
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

    const joinUrl = useMemo(() => (origin ? `${origin}/j/${code}` : ''), [origin, code]);

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

    return (
        // On a `short:` viewport (an SE-sized phone acting as the host) the whole card turns on
        // its side: the QR sits BESIDE the code instead of above it. Stacked, it needed ~344px of
        // height and starved the roster next to it down to a 30px sliver of half-cut names — so
        // the layout gives way before the information does.
        <div
            className={ClassnameHelper.join(
                'flex w-full flex-col items-center',
                'short:flex-row short:items-center short:gap-4',
                className,
            )}
        >
            {/*
             * The box is sized by CSS and the QR fills it (`h-auto w-full` on the SVG), so the
             * same component is a 160px square on a phone and a 232px one on a TV without
             * re-rendering anything. The skeleton is the SAME box with the same aspect, so the
             * card never reflows when `origin` lands after mount.
             */}
            <div
                className={ClassnameHelper.join(
                    'aspect-square w-full shrink-0 rounded-2xl p-3 sm:p-4',
                    joinUrl ? 'bg-white shadow-lg shadow-black/25' : 'animate-pulse bg-white/10',
                    qrClassName,
                )}
            >
                {joinUrl && (
                    <QRCodeSVG
                        value={joinUrl}
                        size={QR_RESOLUTION}
                        level="M"
                        marginSize={0}
                        bgColor="#ffffff"
                        fgColor="#111827"
                        className="h-auto w-full"
                        aria-label={`Código QR para unirse a la partida ${code}`}
                    />
                )}
            </div>

            {/* The `o` divider IS the instruction: scan this, or type that. Side by side, the
                gap already says it, so it drops out. */}
            <div
                className="flex w-full max-w-[15rem] items-center gap-3 py-4 short:hidden"
                aria-hidden="true"
            >
                <span className="h-px flex-1 bg-white/10" />
                <span className="text-sm font-semibold text-gray-400">o</span>
                <span className="h-px flex-1 bg-white/10" />
            </div>

            <div className="flex w-full flex-col items-center short:min-w-0 short:flex-1">
                <CodeDisplay code={code} size="lg" label="Escribe el código" />

                {/* Side by side, the actions stack: two labelled buttons do not fit in the ~160px
                    left over beside the QR, and truncating "Compartir" against the card edge is
                    worse than one more row. */}
                <div className="mt-5 flex w-full max-w-xs gap-2 short:mt-3 short:flex-col">
                    <Button
                        variant="secondary"
                        size="md"
                        fullWidth
                        startContent={copied ? <BiCheck size={18} /> : <BiCopy size={18} />}
                        onPress={handleCopy}
                        isDisabled={!joinUrl}
                    >
                        {copied ? 'Copiado' : 'Copiar'}
                    </Button>
                    {canShare && (
                        <Button
                            variant="secondary"
                            size="md"
                            fullWidth
                            startContent={<BiShareAlt size={18} />}
                            onPress={handleShare}
                            isDisabled={!joinUrl}
                        >
                            Compartir
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};
