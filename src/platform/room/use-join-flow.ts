'use client';

import { parseJoinCode } from '@/platform/room/join-target';
import { resolveJoinCode } from '@/platform/room/room-client';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

/** Why a join attempt didn't go through — each maps to one sentence the player can act on. */
export type JoinError = 'unknown' | 'scan' | 'network';

/**
 * The "six digits → the right game" behaviour behind every way into a room.
 *
 * The player no longer tells us which game they're joining, because they shouldn't have to know:
 * a code is now unique across the whole arcade, so the SERVER resolves it (`/api/join/<code>`)
 * and routes them. That deleted the game picker outright — and with it a genuine bug, since the
 * picker defaulted to Código Secreto: typing a valid La Bomba code with the picker untouched
 * sent you to an EMPTY Código Secreto join form, with nothing on screen explaining why.
 *
 * Every failure now says what happened (`error`) instead of silently dropping the player
 * somewhere they never asked to be.
 */
export function useJoinFlow(initialCode = '', initialError: JoinError | null = null) {
    const router = useRouter();
    const [code, setCode] = useState(initialCode);
    const [scanning, setScanning] = useState(false);
    const [error, setError] = useState<JoinError | null>(initialError);
    const [resolving, setResolving] = useState(false);

    const valid = code.length === 6;

    /** Resolve a code to its game and go there, or explain why we can't. */
    const join = useCallback(
        async (digits: string) => {
            if (digits.length !== 6) return;
            setResolving(true);
            setError(null);
            try {
                const target = await resolveJoinCode(digits);
                if (!target) {
                    setError('unknown');
                    setResolving(false);
                    return;
                }
                // The spinner deliberately stays up through navigation — this route is about to
                // unmount, and flashing the form back for a frame would read as a failure.
                router.push(`/join/${target.game}?code=${digits}`);
            } catch {
                setError('network');
                setResolving(false);
            }
        },
        [router],
    );

    const handleCode = useCallback((digits: string) => {
        setError(null);
        setCode(digits);
    }, []);

    /** A completed 6-digit entry submits itself — no reason to make anyone press a button too. */
    const submitIfValid = useCallback((digits: string) => void join(digits), [join]);

    const submit = useCallback(() => void join(code), [join, code]);

    const handleDetect = useCallback(
        (text: string) => {
            const scanned = parseJoinCode(text);
            if (scanned === null) {
                // Keep the scanner open so the player can re-aim; surface a note underneath.
                setError('scan');
                return;
            }
            setScanning(false);
            setCode(String(scanned));
            void join(String(scanned));
        },
        [join],
    );

    const openScanner = useCallback(() => {
        setError(null);
        setScanning(true);
    }, []);

    const closeScanner = useCallback(() => setScanning(false), []);

    return {
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
    };
}
