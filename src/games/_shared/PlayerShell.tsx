'use client';

import { usePlayerRoom } from '@/platform/room/use-player-room';
import { useHeartbeat } from '@/platform/room/use-presence';
import { PrimaryButton } from '@/platform/ui/Button';
import { Input, Spinner } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { FormEvent, ReactNode, useState } from 'react';

/**
 * Shared player ("phone") shell for per-player-secret games. Handles the three states
 * every such game's phone view goes through — loading, no/unknown code (join form),
 * and ready — and hands the game its shared payload plus this phone's claimed seat.
 * Games only render their own secret card via `children`.
 */
interface PlayerShellProps<T> {
    game: string;
    gameName: string;
    code: number | null;
    children: (payload: T, seat: number) => ReactNode;
}

const JoinForm = ({ game, gameName }: { game: string; gameName: string }) => {
    const router = useRouter();
    const [code, setCode] = useState('');
    const normalized = code.replace(/\D/g, '').slice(0, 6);
    const isValid = normalized.length === 6;

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (isValid) router.push(`/join/${game}?code=${normalized}`);
    };

    return (
        <main className="flex min-h-screen items-center justify-center px-6 py-12">
            <div className="w-full max-w-sm rounded-3xl bg-gray-900/80 p-8 text-center ring-1 ring-inset ring-white/10 backdrop-blur">
                <h1 className="text-2xl font-bold text-white">{gameName}</h1>
                <p className="mt-2 text-sm text-gray-400">
                    Introduce el código que ve el anfitrión en la pantalla.
                </p>
                <form className="mt-6 flex flex-col gap-4" onSubmit={submit}>
                    <Input
                        classNames={{
                            input: 'px-1 text-center text-lg tracking-[0.3em]',
                            inputWrapper: 'h-14 bg-white/5 text-white',
                        }}
                        aria-label="Código de la partida"
                        inputMode="numeric"
                        maxLength={6}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="Código de 6 cifras"
                        size="lg"
                        value={code}
                        variant="faded"
                    />
                    <PrimaryButton type="submit" className="w-full" isDisabled={!isValid}>
                        Unirse
                    </PrimaryButton>
                </form>
            </div>
        </main>
    );
};

export function PlayerShell<T>({ game, gameName, code, children }: PlayerShellProps<T>) {
    const { status, payload, seat } = usePlayerRoom<T>({ game, code, withSeat: true });
    // Announce presence so the host lobby counts this phone live (no-op when code null).
    useHeartbeat({ game, code });

    if (status === 'loading') {
        return (
            <div className="flex h-screen items-center justify-center">
                <Spinner color="secondary" label="Entrando en la partida…" />
            </div>
        );
    }

    if (status === 'ready' && payload && seat !== null) {
        return <>{children(payload, seat)}</>;
    }

    return <JoinForm game={game} gameName={gameName} />;
}
