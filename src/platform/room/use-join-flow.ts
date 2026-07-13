'use client';

import { parseJoinCode } from '@/platform/room/join-target';
import { resolveJoinCode } from '@/platform/room/room-client';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

/** Why a join attempt didn't go through — each maps to one sentence the player can act on. */
export type JoinError = 'unknown' | 'scan' | 'network';

/** The game a code turned out to belong to, as the server resolved it. */
export interface JoinTarget {
    game: string;
    name: string;
    emoji: string;
}

/**
 * How long the resolved game is held on screen before we navigate. The code→game resolution is
 * the one moment the player is owed an answer to the question they couldn't answer themselves
 * ("which game am I even joining?"), and we used to spend it on a bare spinner. Long enough to
 * read "Te unes a 💣 La Bomba", short enough that nobody feels held back — and it overlaps with
 * the route transition it precedes, so most of it is time we were spending anyway.
 */
const CONFIRM_BEAT_MS = 800;

/**
 * The "six digits → the right game" behaviour behind every way into a room.
 *
 * The player no longer tells us which game they're joining, because they shouldn't have to know:
 * a code is now unique across the whole arcade, so the SERVER resolves it (`/api/join/<code>`)
 * and routes them. That deleted the game picker outright — and with it a genuine bug, since the
 * picker defaulted to Código Secreto: typing a valid La Bomba code with the picker untouched
 * sent you to an EMPTY Código Secreto join form, with nothing on screen explaining why.
 *
 * Every outcome now says what happened — a failure names its reason (`error`), and a success
 * names the game it found (`resolved`) — instead of silently moving the player somewhere.
 */
export function useJoinFlow(initialCode = '', initialError: JoinError | null = null) {
    const router = useRouter();
    const [code, setCode] = useState(initialCode);
    const [scanning, setScanning] = useState(false);
    const [error, setError] = useState<JoinError | null>(initialError);
    const [resolving, setResolving] = useState(false);
    /** The resolved game plus the digits that found it — the destination, held for one beat. */
    const [hit, setHit] = useState<{ target: JoinTarget; digits: string } | null>(null);

    // The beat is a render-driven effect rather than a stray timer, so React owns its lifetime:
    // a player who backs out mid-beat cancels the pending navigation instead of being yanked
    // into a game they have already left.
    useEffect(() => {
        if (!hit) return;
        const timer = setTimeout(
            () => router.push(`/join/${hit.target.game}?code=${hit.digits}`),
            CONFIRM_BEAT_MS,
        );
        return () => clearTimeout(timer);
    }, [hit, router]);

    const valid = code.length === 6;

    /** Resolve a code to its game and go there, or explain why we can't. */
    const join = useCallback(async (digits: string) => {
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
            // `resolving` deliberately stays up through the beat AND the navigation: this
            // route is about to unmount, and flashing the form back for a frame would read
            // as a failure.
            setHit({ target, digits });
        } catch {
            setError('network');
            setResolving(false);
        }
    }, []);

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
        /** The game the code turned out to be, from the instant it resolves until we leave. */
        resolved: hit?.target ?? null,
        valid,
        handleCode,
        handleDetect,
        submit,
        submitIfValid,
        openScanner,
        closeScanner,
    };
}
