'use client';

import { PrimaryButton } from '@/platform/ui/Button';
import { Input } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { FC, FormEvent, useState } from 'react';

/**
 * Shared "enter the code" panel for a single game's player view — the empty state
 * every phone shows when it arrives without a valid code. One component so all four
 * games' join screens look identical (the generic `/join` page adds a game picker on
 * top of the same visual language).
 */
export const JoinForm: FC<{ game: string; gameName: string }> = ({ game, gameName }) => {
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
                        placeholder="Código"
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
