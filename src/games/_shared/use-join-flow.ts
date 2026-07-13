'use client';

import { parseJoinTarget } from '@/platform/room/join-target';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

/**
 * The shared "type a code / scan a QR → route into a room" behaviour behind both join
 * surfaces: `JoinForm` (a single fixed game's empty state) and `JoinPanel` (the generic
 * picker). Only the logic lives here — each caller keeps its own layout/markup. The
 * `game` argument is the current target: a fixed game for `JoinForm`, the picked one
 * for `JoinPanel`. It also doubles as the fallback game when a scanned code carries no
 * game of its own, and gates `valid` so an empty picker can't submit.
 */
export function useJoinFlow(game: string) {
    const router = useRouter();
    const [code, setCode] = useState('');
    const [scanning, setScanning] = useState(false);
    const [scanError, setScanError] = useState(false);

    const valid = code.length === 6 && game !== '';

    const routeTo = (targetGame: string, joinCode: number | string) =>
        router.push(`/join/${targetGame}?code=${joinCode}`);

    /** From the "Unirse" button — routes the current game with the typed code. */
    const submit = () => {
        if (valid) routeTo(game, code);
    };

    /** From `CodeInput.onComplete` — the freshly-completed digits arrive as an arg. */
    const submitIfValid = (digits: string) => {
        if (digits.length === 6 && game !== '') routeTo(game, digits);
    };

    const handleCode = (digits: string) => {
        setScanError(false);
        setCode(digits);
    };

    const handleDetect = (text: string) => {
        const target = parseJoinTarget(text, game);
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

    const closeScanner = () => setScanning(false);

    return {
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
    };
}
