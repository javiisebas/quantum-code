'use client';

import { Button, Input } from '@nextui-org/react';
import { useRouter } from 'next/navigation';
import { FC, FormEvent, useState } from 'react';

export const SpyJoinGame: FC = () => {
    const [gameCode, setGameCode] = useState('');
    const router = useRouter();

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        router.push(`/spy?code=${gameCode.replace(/\s+/g, '')}`);
    };

    return (
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
            <div className="bg-gray-400/50 p-2 ring-1 ring-inset ring-gray-900/10 rounded-lg sm:rounded-3xl">
                <div className="relative isolate grid grid-cols-1 gap-10 overflow-hidden bg-gray-900 px-6 py-14 shadow-2xl rounded-md sm:rounded-2xl sm:px-24 xl:grid-cols-5 xl:py-32 text-balance">
                    <div className="col-span-3 md:text-center xl:text-left">
                        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">
                            Join the Spy Game
                        </h2>
                        <p className="mt-4 text-lg leading-6 text-gray-300">
                            Enter the game code and become a spy. Ready to take on the challenge?
                        </p>
                    </div>

                    <form
                        className="col-span-3 md:col-span-2 flex w-full max-w-lg flex-col gap-3 items-center justify-center h-full"
                        onSubmit={handleSubmit}
                    >
                        <Input
                            classNames={{
                                input: 'focus:outline-none border-transparent focus:border-transparent focus:ring-0 px-1',
                                inputWrapper: 'h-full bg-white/5 text-white border',
                            }}
                            isClearable={false}
                            onChange={(e) => setGameCode(e.target.value)}
                            placeholder="Enter game code"
                            size="lg"
                            type="text"
                            value={gameCode}
                            variant="faded"
                        />

                        <Button
                            size="lg"
                            type="submit"
                            className="w-full rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                        >
                            Join Game
                        </Button>
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
                            fill="url(#759c1415-0410-454c-8f7c-9a820de03641)"
                            fillOpacity="0.7"
                        />
                        <defs>
                            <radialGradient
                                r={1}
                                cx={0}
                                cy={0}
                                id="759c1415-0410-454c-8f7c-9a820de03641"
                                gradientUnits="userSpaceOnUse"
                                gradientTransform="translate(512 512) rotate(90) scale(512)"
                            >
                                <stop stopColor="#7775D6" />
                                <stop offset={1} stopColor="#E935C1" stopOpacity={0} />
                            </radialGradient>
                        </defs>
                    </svg>
                </div>
            </div>
        </div>
    );
};
