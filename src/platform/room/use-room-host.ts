'use client';

import { LocalStorageHelper } from '@/platform/persistence/local-storage';
import { useCallback, useEffect, useRef, useState } from 'react';
import { generateCode } from './code';
import { createRoom, deleteRoom } from './room-client';

/**
 * Host-side room lifecycle for games where the host generates a payload ONCE and
 * shares a join code (Spyfall, Undercover, …). It is the reusable essence of the
 * Codenames `GameProvider` minus the game-specific reveal logic:
 *
 *  - bootstrap once (StrictMode-guarded): resume the persisted room for this game,
 *    or create a fresh one;
 *  - publish the payload atomically (server SET-NX → authoritative value);
 *  - persist `{ code, payload }` to localStorage so a reload resumes the same room;
 *  - `newRoom()` releases the current room and starts a fresh one.
 *
 * Games with richer local state (like Codenames' per-card reveals) keep their own
 * reducer/provider and use the lower-level room client directly instead.
 */
export interface RoomHost<T> {
    code: number | null;
    payload: T | null;
    status: 'loading' | 'ready' | 'error';
    error: string | null;
    /** Release the current room and start a fresh one (new code + payload). */
    newRoom: () => void;
}

interface PersistedHost<T> {
    code: number;
    payload: T;
}

const storageKey = (game: string) => `quantum:host:${game}`;

const LOAD_ERROR = 'No se pudo crear la partida. Revisa tu conexión e inténtalo de nuevo.';

export function useRoomHost<T>({ game, build }: { game: string; build: () => T }): RoomHost<T> {
    const [code, setCode] = useState<number | null>(null);
    const [payload, setPayload] = useState<T | null>(null);
    const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
    const [error, setError] = useState<string | null>(null);

    // Keep the latest build function without re-triggering the bootstrap effect.
    const buildRef = useRef(build);
    buildRef.current = build;

    // Always-current code, so `newRoom` can release the previous room without
    // depending on (and being re-created by) the `code` state.
    const codeRef = useRef<number | null>(null);
    codeRef.current = code;

    const publish = useCallback(
        async (nextCode: number, candidate: T) => {
            setStatus('loading');
            setError(null);
            try {
                const authoritative = await createRoom<T>(game, nextCode, candidate);
                setCode(nextCode);
                setPayload(authoritative);
                setStatus('ready');
                LocalStorageHelper.setLocalStorageItem<PersistedHost<T>>(storageKey(game), {
                    code: nextCode,
                    payload: authoritative,
                });
            } catch {
                setStatus('error');
                setError(LOAD_ERROR);
            }
        },
        [game],
    );

    // Bootstrap once (guard against React StrictMode's dev double-invoke).
    const bootstrappedRef = useRef(false);
    useEffect(() => {
        if (bootstrappedRef.current) return;
        bootstrappedRef.current = true;

        const persisted = LocalStorageHelper.getLocalStorageItem<PersistedHost<T>>(
            storageKey(game),
        );
        if (persisted?.code) {
            // Resume without a network round-trip; the payload is authoritative for
            // this device and is re-published lazily only when a new room is created.
            setCode(persisted.code);
            setPayload(persisted.payload);
            setStatus('ready');
        } else {
            void publish(generateCode(), buildRef.current());
        }
    }, [game, publish]);

    const newRoom = useCallback(() => {
        const previous = codeRef.current;
        if (previous) deleteRoom(game, previous).catch(() => {});
        void publish(generateCode(), buildRef.current());
    }, [game, publish]);

    return { code, payload, status, error, newRoom };
}
