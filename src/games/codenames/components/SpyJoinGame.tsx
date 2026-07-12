'use client';

import { PrimaryButton } from '@/platform/ui/Button';
import { Input } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { FC, FormEvent, useState } from 'react';

export const SpyJoinGame: FC = () => {
    const [gameCode, setGameCode] = useState('');
    const router = useRouter();

    const normalizedCode = gameCode.replace(/\D/g, '').slice(0, 6);
    const isValid = normalizedCode.length === 6;

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!isValid) return;
        router.push(`/join/codenames?code=${normalizedCode}`);
    };

    return (
        <div className="relative flex items-center justify-center w-full h-screen overflow-hidden">
            <div className="mx-auto max-w-5xl px-6 lg:px-8">
                <div className="bg-gray-400/50 p-2 ring-1 ring-inset ring-gray-900/10 rounded-lg sm:rounded-3xl">
                    <div className="relative isolate grid grid-cols-1 gap-10 overflow-hidden bg-gray-900 px-6 py-14 shadow-2xl rounded-lg sm:rounded-2xl sm:px-24 xl:grid-cols-5 xl:py-32 text-balance">
                        <div className="col-span-3 md:text-center xl:text-left">
                            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">
                                Únete como espía
                            </h2>
                            <p className="mt-4 text-lg leading-6 text-gray-300">
                                Introduce el código de la partida y conviértete en espía. ¿Listo
                                para el reto?
                            </p>
                        </div>

                        <form
                            className="col-span-3 md:col-span-2 flex w-full max-w-lg flex-col gap-3 items-center justify-center h-full"
                            onSubmit={handleSubmit}
                        >
                            <Input
                                classNames={{
                                    input: 'focus:outline-none border-transparent focus:border-transparent focus:ring-0 px-1 tracking-[0.3em] text-center text-lg',
                                    inputWrapper: 'h-full bg-white/5 text-white border',
                                }}
                                aria-label="Código de la partida"
                                inputMode="numeric"
                                isClearable={false}
                                maxLength={6}
                                onChange={(e) => setGameCode(e.target.value.replace(/\D/g, ''))}
                                placeholder="Código"
                                size="lg"
                                type="text"
                                value={gameCode}
                                variant="faded"
                            />

                            <PrimaryButton type="submit" className="w-full" isDisabled={!isValid}>
                                Unirse a la partida
                            </PrimaryButton>
                        </form>

                        <svg
                            viewBox="0 0 1024 1024"
                            aria-hidden="true"
                            className="absolute left-1/2 top-1/2 -z-10 size-[64rem] -translate-x-1/2"
                        >
                            <circle
                                r={512}
                                cx={512}
                                cy={512}
                                fill="url(#spy-join-gradient)"
                                fillOpacity="0.7"
                            />
                            <defs>
                                <radialGradient
                                    r={1}
                                    cx={0}
                                    cy={0}
                                    id="spy-join-gradient"
                                    gradientUnits="userSpaceOnUse"
                                    gradientTransform="translate(512 512) rotate(90) scale(512)"
                                >
                                    <stop stopColor="#C27AFF" />
                                    <stop offset={1} stopColor="#C27AFF" stopOpacity={0} />
                                </radialGradient>
                            </defs>
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    );
};
