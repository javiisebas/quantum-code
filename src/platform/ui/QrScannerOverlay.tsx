'use client';

import { Button, IconButton } from '@/platform/ui/Button';
import { Eyebrow } from '@/platform/ui/Eyebrow';
import { Surface } from '@/platform/ui/Surface';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { BiCameraOff, BiX, BiXCircle } from 'react-icons/bi';
import jsQR from 'jsqr';

/**
 * Full-screen, production-grade in-app QR scanner.
 *
 * ## Why this component exists
 * Joining a room by pointing the phone at another screen's QR is the fastest path in,
 * so the scanner has to "just work" — including on iOS Safari, which is the strictest
 * environment for camera access. This component owns the whole camera lifecycle and the
 * decode loop, and reports a single decoded string back to its caller.
 *
 * ## Integration contract (for other agents)
 * ```tsx
 * <QrScannerOverlay
 *   onDetect={(text) => navigate(text)} // text = decoded QR payload (a URL or a room code)
 *   onClose={() => setScanning(false)}  // user dismissed the scanner
 * />
 * ```
 * - `onDetect` fires **exactly once**. The moment a QR is decoded we stop the loop and
 *   release the camera *before* invoking it, so the caller can navigate/close freely.
 * - `onClose` fires when the user dismisses (X button, "Cerrar", or Escape) or when the
 *   environment can't scan. It is never called together with `onDetect`.
 * - The overlay renders itself (`fixed inset-0 z-50`); mount it conditionally and unmount
 *   it to tear everything down — unmount always releases the camera.
 *
 * ## Dual-decoder strategy
 * There is no single QR decoder available everywhere, so we pick the best per platform:
 *
 *  1. **`BarcodeDetector` (fast path).** Chrome/Android (and some others) ship a native,
 *     GPU-accelerated detector. When `'BarcodeDetector' in window` AND its
 *     `getSupportedFormats()` advertises `'qr_code'`, we build a
 *     `new BarcodeDetector({ formats: ['qr_code'] })` and call `detect(video)` directly on
 *     the live `<video>` element — no canvas copy, low CPU, high frame rate.
 *
 *  2. **`jsQR` (fallback).** iOS Safari has no `BarcodeDetector`, so we decode in JS:
 *     draw the current video frame onto an **offscreen canvas downscaled to ≤ 640px on the
 *     long edge** (jsQR is O(pixels); downscaling keeps a phone at interactive speed while
 *     still resolving a framed QR), read the `ImageData`, and hand it to
 *     `jsQR(data, w, h, { inversionAttempts: 'dontInvert' })`. `dontInvert` skips the
 *     inverted-colour pass — real QR codes are dark-on-light, so this roughly halves work.
 *
 * Both run inside one throttled `requestAnimationFrame` loop (rAF pauses automatically when
 * the tab is hidden, unlike `setInterval`). A `busy` guard prevents overlapping async
 * detections, and a throttle caps work at ~8fps (native) / ~5fps (jsQR).
 *
 * ## iOS Safari constraints (the reason for several non-obvious choices)
 * - The `<video>` MUST be `playsInline` + `muted`, otherwise iOS refuses inline playback
 *   (it would try to go fullscreen) and blocks autoplay. We also set `video.muted = true`
 *   imperatively before `play()` because the React `muted` prop is unreliable on iOS.
 * - We must call `video.play()` ourselves and await it; `autoPlay` alone is not enough.
 * - We request `audio: false` so iOS never shows a microphone permission prompt and no
 *   audio track is ever opened.
 *
 * ## Lifecycle & safety
 * - Camera starts on mount; on unmount / close / successful decode, **every**
 *   `MediaStreamTrack` is stopped and the rAF loop is cancelled — no leaked camera light.
 * - Guarded against React StrictMode's double mount (an async-start `cancelled` flag that
 *   the cleanup trips) and against a double `onDetect` (a `detectedRef` latch).
 * - `role="dialog"` / `aria-modal` / `aria-label`; Escape closes; reduced motion is
 *   respected (all animation is `motion-safe:` and non-essential).
 */
export interface QrScannerOverlayProps {
    /** Called ONCE with the decoded QR string (a URL or a code); scanning then stops. */
    onDetect: (text: string) => void;
    /** Called when the user closes the scanner (or the environment can't scan). */
    onClose: () => void;
}

/** The four visual states the overlay can be in. */
type ScannerStatus = 'requesting' | 'scanning' | 'denied' | 'unsupported';

/**
 * Minimal local typing for the `BarcodeDetector` API — it is not part of the TS DOM lib.
 * Declared locally (not as a global) so it stays scoped to this file.
 */
interface DetectedBarcode {
    rawValue: string;
    format: string;
}
interface BarcodeDetectorInstance {
    detect(source: CanvasImageSource): Promise<DetectedBarcode[]>;
}
interface BarcodeDetectorConstructor {
    new (options?: { formats?: string[] }): BarcodeDetectorInstance;
    getSupportedFormats(): Promise<string[]>;
}

/** HTMLMediaElement.readyState ≥ HAVE_CURRENT_DATA means a frame is available to read. */
const HAVE_CURRENT_DATA = 2;
/** jsQR fallback: longest edge to downscale the captured frame to before decoding. */
const MAX_DECODE_EDGE = 640;

export function QrScannerOverlay({ onDetect, onClose }: QrScannerOverlayProps) {
    const [status, setStatus] = useState<ScannerStatus>('requesting');

    const videoRef = useRef<HTMLVideoElement | null>(null);
    /** Offscreen canvas reused across frames for the jsQR fallback (created lazily). */
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const rafRef = useRef<number | null>(null);
    /** Latch so `onDetect` can only ever fire once. */
    const detectedRef = useRef(false);

    /**
     * Keep the latest callbacks in refs so the start-effect can run exactly once (empty
     * deps) without restarting the camera when the parent re-renders with new inline
     * `onDetect`/`onClose` closures.
     */
    const onDetectRef = useRef(onDetect);
    const onCloseRef = useRef(onClose);
    useEffect(() => {
        onDetectRef.current = onDetect;
        onCloseRef.current = onClose;
    });

    /** Cancel the decode loop and fully release the camera (idempotent). */
    const stopCamera = useCallback(() => {
        if (rafRef.current !== null) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }
        const stream = streamRef.current;
        if (stream) {
            stream.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
        const video = videoRef.current;
        if (video) video.srcObject = null;
    }, []);

    const finishWith = useCallback(
        (value: string) => {
            if (detectedRef.current) return;
            detectedRef.current = true;
            stopCamera();
            onDetectRef.current(value);
        },
        [stopCamera],
    );

    const handleClose = useCallback(() => {
        stopCamera();
        onCloseRef.current();
    }, [stopCamera]);

    /** Decode the current frame with jsQR via a downscaled offscreen canvas. */
    const decodeWithJsQR = useCallback((video: HTMLVideoElement): string | null => {
        const vw = video.videoWidth;
        const vh = video.videoHeight;
        if (!vw || !vh) return null;

        const scale = Math.min(1, MAX_DECODE_EDGE / Math.max(vw, vh));
        const w = Math.max(1, Math.round(vw * scale));
        const h = Math.max(1, Math.round(vh * scale));

        let canvas = canvasRef.current;
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvasRef.current = canvas;
        }
        if (canvas.width !== w) canvas.width = w;
        if (canvas.height !== h) canvas.height = h;

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return null;

        ctx.drawImage(video, 0, 0, w, h);
        const { data } = ctx.getImageData(0, 0, w, h);
        const result = jsQR(data, w, h, { inversionAttempts: 'dontInvert' });
        return result?.data ?? null;
    }, []);

    // Camera lifecycle + decode loop. Runs once (callbacks are stable / ref-backed).
    useEffect(() => {
        detectedRef.current = false;
        let cancelled = false;

        const runLoop = (detector: BarcodeDetectorInstance | null) => {
            const throttleMs = detector ? 120 : 200;
            let lastRun = 0;
            let busy = false;

            const tick = (timestamp: number) => {
                if (cancelled || detectedRef.current) return;
                // Schedule the next frame up-front so a slow decode can't stall the loop.
                rafRef.current = requestAnimationFrame(tick);
                if (busy || timestamp - lastRun < throttleMs) return;

                const video = videoRef.current;
                if (!video || video.readyState < HAVE_CURRENT_DATA) return;

                lastRun = timestamp;
                busy = true;
                Promise.resolve()
                    .then(async () => {
                        const value = detector
                            ? (await detector.detect(video))[0]?.rawValue ?? null
                            : decodeWithJsQR(video);
                        if (value && !cancelled) finishWith(value);
                    })
                    // Transient decode errors (e.g. a frame not yet ready) are expected.
                    .catch(() => undefined)
                    .finally(() => {
                        busy = false;
                    });
            };

            rafRef.current = requestAnimationFrame(tick);
        };

        const start = async () => {
            // Insecure context, no MediaDevices, or no getUserMedia → can't scan here.
            if (
                typeof window === 'undefined' ||
                !window.isSecureContext ||
                !navigator.mediaDevices ||
                typeof navigator.mediaDevices.getUserMedia !== 'function'
            ) {
                if (!cancelled) setStatus('unsupported');
                return;
            }

            setStatus('requesting');

            let stream: MediaStream;
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment' },
                    audio: false,
                });
            } catch (err) {
                if (cancelled) return;
                const name = (err as { name?: string })?.name;
                // The user rejected the prompt (or a policy blocked it) → "denied";
                // no camera / constraint failure → "unsupported".
                setStatus(name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : 'unsupported');
                return;
            }

            // The effect may have been cleaned up while we awaited the prompt.
            if (cancelled) {
                stream.getTracks().forEach((track) => track.stop());
                return;
            }

            const video = videoRef.current;
            if (!video) {
                stream.getTracks().forEach((track) => track.stop());
                return;
            }

            streamRef.current = stream;
            video.srcObject = stream;
            // iOS: set muted imperatively (the React prop is unreliable) then play() ourselves.
            video.muted = true;
            try {
                await video.play();
            } catch {
                // iOS can reject play() if interrupted; playsInline + muted normally allow it.
            }
            if (cancelled) return;

            setStatus('scanning');

            // Prefer the native detector; fall back to jsQR otherwise.
            let detector: BarcodeDetectorInstance | null = null;
            const Ctor = (window as unknown as { BarcodeDetector?: BarcodeDetectorConstructor })
                .BarcodeDetector;
            if (Ctor) {
                try {
                    const formats = await Ctor.getSupportedFormats();
                    if (!cancelled && formats.includes('qr_code')) {
                        detector = new Ctor({ formats: ['qr_code'] });
                    }
                } catch {
                    detector = null;
                }
            }
            if (cancelled) return;

            runLoop(detector);
        };

        void start();

        return () => {
            cancelled = true;
            stopCamera();
        };
    }, [stopCamera, finishWith, decodeWithJsQR]);

    // Escape closes the scanner.
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') handleClose();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [handleClose]);

    const showVideo = status === 'requesting' || status === 'scanning';

    // Portal to <body>: the overlay is `position: fixed`, but an ancestor with
    // `backdrop-filter`/`transform` (e.g. a frosted `Surface` card) would become its
    // containing block and confine it. Portalling out guarantees a true full-screen scanner.
    if (typeof document === 'undefined') return null;

    return createPortal(
        <div
            role="dialog"
            aria-modal="true"
            aria-label="Escanear código QR"
            className="fixed inset-0 z-50 bg-gray-950 text-white"
        >
            {/* Live camera preview. Kept mounted through requesting→scanning so the ref
                exists when we attach the stream. `playsInline` + `muted` are load-bearing on iOS. */}
            {showVideo && (
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="absolute inset-0 h-full w-full bg-black object-cover"
                />
            )}

            {status === 'scanning' && (
                <>
                    {/* Subtle scrim so the reticle and hint stay legible over any scene. */}
                    <div className="pointer-events-none absolute inset-0 bg-black/25" aria-hidden="true" />
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-7 px-6">
                        <div className="relative aspect-square w-full max-w-[280px]">
                            <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/20" />
                            {/* Four rounded corner brackets framing the target. */}
                            <span className="absolute left-0 top-0 h-9 w-9 rounded-tl-3xl border-l-[3px] border-t-[3px] border-white/85" />
                            <span className="absolute right-0 top-0 h-9 w-9 rounded-tr-3xl border-r-[3px] border-t-[3px] border-white/85" />
                            <span className="absolute bottom-0 left-0 h-9 w-9 rounded-bl-3xl border-b-[3px] border-l-[3px] border-white/85" />
                            <span className="absolute bottom-0 right-0 h-9 w-9 rounded-br-3xl border-b-[3px] border-r-[3px] border-white/85" />
                        </div>
                        <Eyebrow className="text-center text-white/80">
                            Apunta la cámara al código QR
                        </Eyebrow>
                    </div>
                </>
            )}

            {/* Top-right close, respecting the notch / safe areas. Shown while the camera is live. */}
            {showVideo && (
                <div
                    className="absolute right-0 top-0 z-10"
                    style={{
                        paddingTop: 'calc(env(safe-area-inset-top) + 1rem)',
                        paddingRight: 'calc(env(safe-area-inset-right) + 1rem)',
                    }}
                >
                    <IconButton aria-label="Cerrar" onPress={handleClose}>
                        <BiX className="h-6 w-6" />
                    </IconButton>
                </div>
            )}

            {status === 'requesting' && (
                <div className="absolute inset-0 flex items-center justify-center p-6">
                    <Surface className="flex w-full max-w-sm flex-col items-center gap-4 p-8 text-center">
                        <span
                            className="h-8 w-8 rounded-full border-2 border-white/20 border-t-white/80 motion-safe:animate-spin"
                            aria-hidden="true"
                        />
                        <p className="text-sm text-gray-300">Pidiendo acceso a la cámara…</p>
                    </Surface>
                </div>
            )}

            {status === 'denied' && (
                <div className="absolute inset-0 flex items-center justify-center p-6">
                    <Surface className="flex w-full max-w-sm flex-col items-center gap-5 p-8 text-center">
                        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/5 ring-1 ring-inset ring-white/10">
                            <BiXCircle className="h-7 w-7 text-rose-300" aria-hidden="true" />
                        </span>
                        <div className="space-y-1.5">
                            <h2 className="text-lg font-semibold text-white">
                                No podemos acceder a la cámara
                            </h2>
                            <p className="text-sm text-gray-400">
                                Activa el permiso de cámara del navegador o escribe el código a mano.
                            </p>
                        </div>
                        <Button variant="secondary" fullWidth onPress={handleClose}>
                            Cerrar
                        </Button>
                    </Surface>
                </div>
            )}

            {status === 'unsupported' && (
                <div className="absolute inset-0 flex items-center justify-center p-6">
                    <Surface className="flex w-full max-w-sm flex-col items-center gap-5 p-8 text-center">
                        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/5 ring-1 ring-inset ring-white/10">
                            <BiCameraOff className="h-7 w-7 text-gray-300" aria-hidden="true" />
                        </span>
                        <div className="space-y-1.5">
                            <h2 className="text-lg font-semibold text-white">
                                Tu navegador no permite escanear aquí
                            </h2>
                            <p className="text-sm text-gray-400">
                                Escribe el código a mano para unirte a la sala.
                            </p>
                        </div>
                        <Button variant="secondary" fullWidth onPress={handleClose}>
                            Cerrar
                        </Button>
                    </Surface>
                </div>
            )}
        </div>,
        document.body,
    );
}
