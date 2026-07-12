'use client';

import { gameManifests } from '@/games/registry';
import { PrimaryButton } from '@/platform/ui/Button';
import { ClassnameHelper } from '@/platform/util/classnames';
import { Input } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

/**
 * Generic join screen for players who did not scan a QR: pick the game the host
 * chose, type the 6-digit code, and land on that game's player view. (Scanning the
 * host QR skips this entirely and goes straight to `/join/<game>?code=…`.)
 */
export default function JoinPage() {
    const router = useRouter();
    const [gameId, setGameId] = useState(gameManifests[0]?.id ?? '');
    const [code, setCode] = useState('');

    const normalizedCode = code.replace(/\D/g, '').slice(0, 6);
    const isValid = normalizedCode.length === 6 && gameId !== '';

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!isValid) return;
        router.push(`/join/${gameId}?code=${normalizedCode}`);
    };

    return (
        <main className="flex min-h-screen items-center justify-center px-6 py-12">
            <div className="w-full max-w-md rounded-3xl bg-gray-900/80 p-8 ring-1 ring-inset ring-white/10 backdrop-blur">
                <h1 className="text-2xl font-bold text-white">Unirse a una partida</h1>
                <p className="mt-2 text-sm text-gray-400">
                    Elige el juego e introduce el código que ve el anfitrión.
                </p>

                <form className="mt-6 flex flex-col gap-5" onSubmit={handleSubmit}>
                    <fieldset>
                        <legend className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
                            Juego
                        </legend>
                        <div className="flex flex-wrap gap-2">
                            {gameManifests.map((game) => {
                                const selected = game.id === gameId;
                                return (
                                    <button
                                        key={game.id}
                                        type="button"
                                        aria-pressed={selected}
                                        onClick={() => setGameId(game.id)}
                                        className={ClassnameHelper.join(
                                            'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ring-1 ring-inset transition',
                                            selected
                                                ? 'bg-purple-600 text-white ring-purple-400'
                                                : 'bg-white/5 text-gray-300 ring-white/10 hover:bg-white/10',
                                        )}
                                    >
                                        <span aria-hidden="true">{game.emoji}</span>
                                        {game.name}
                                    </button>
                                );
                            })}
                        </div>
                    </fieldset>

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
                        type="text"
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
}
