'use client';

import { GameLocalStorageKeyEnum } from '@/enum/game-local-storage-key.enum';
import { LocalStorageHelper } from '@/helpers/local-storage.helper';
import { Button } from '@nextui-org/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ManageRolesService } from './api/roles/services/manage-roles.service';

export default function HomePage() {
    const [existingCode, setExistingCode] = useState<number | null>(null);
    const router = useRouter();

    useEffect(() => {
        const savedCode = LocalStorageHelper.getLocalStorageItem<number>(
            GameLocalStorageKeyEnum.GAME_CODE,
        );
        if (savedCode) setExistingCode(savedCode);
    }, []);

    const handleResumeGame = () => {
        if (existingCode) router.push(`/play`);
    };

    const handleNewGame = () => {
        for (const key of Object.keys(GameLocalStorageKeyEnum)) {
            const value = GameLocalStorageKeyEnum[key as keyof typeof GameLocalStorageKeyEnum];
            LocalStorageHelper.removeLocalStorageItem(value);
        }

        if (existingCode) ManageRolesService.deleteRoles(existingCode);
        router.push(`/play`);
    };

    const handleJoinAsSpy = () => {
        router.push('/spy');
    };

    return (
        <div className="m-auto max-w-7xl lg:grid lg:grid-cols-12 lg:gap-x-8 lg:px-8 min-h-screen">
            <div className="flex items-center justify-center px-6 lg:col-span-7 lg:px-8 xl:col-span-6">
                <div className="max-w-lg w-full">
                    {existingCode && (
                        <button
                            className="hidden sm:mb-10 sm:flex lg:mb-16"
                            onClick={handleResumeGame}
                        >
                            <div className="relative rounded-full px-4 py-2 text-sm text-gray-600 bg-gray-100 ring-1 ring-gray-900/10 hover:ring-gray-900/20 flex gap-2">
                                <p>You already have an active game!</p>
                                <p className="whitespace-nowrap font-semibold text-indigo-600 hover:text-indigo-800 transition">
                                    Resume your game <span aria-hidden="true">&rarr;</span>
                                </p>
                            </div>
                        </button>
                    )}
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-5xl">
                        Quantum Code
                    </h1>
                    <p className="mt-8 text-lg font-medium text-gray-500 sm:text-xl">
                        Embark on a journey of secrets and strategy. Retake your position as a
                        master spy or join a game to test your wits!
                    </p>
                    <div className="mt-10 flex items-center gap-x-6">
                        <Button
                            size="lg"
                            onClick={handleNewGame}
                            className="rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                        >
                            New Game
                        </Button>
                        <Button
                            size="lg"
                            onClick={handleJoinAsSpy}
                            className="rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                        >
                            Join as Spy
                        </Button>
                    </div>
                </div>
            </div>
            <div className="relative lg:col-span-5 lg:-mr-8 xl:absolute xl:inset-0 xl:left-1/2 xl:mr-0">
                <img
                    alt=""
                    src="https://images.unsplash.com/photo-1487017159836-4e23ece2e4cf?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2102&q=80"
                    className="aspect-[3/2] w-full bg-gray-50 object-cover lg:absolute lg:inset-0 lg:aspect-auto lg:h-full"
                />
            </div>
        </div>
    );
}
