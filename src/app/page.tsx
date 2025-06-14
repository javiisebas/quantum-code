'use client';

import { GameLocalStorageKeyEnum } from '@/enum/game-local-storage-key.enum';
import { LocalStorageHelper } from '@/helpers/local-storage.helper';
import { Button } from '@nextui-org/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ManageRolesService } from './api/roles/services/manage-roles.service';

export default function HomePage() {
    const [existingCode, setExistingCode] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const savedCode = LocalStorageHelper.getLocalStorageItem<number>(
            GameLocalStorageKeyEnum.GAME_CODE,
        );

        if (savedCode) setExistingCode(savedCode);
        setLoading(false);
    }, []);

    const handleResumeGame = () => {
        if (existingCode) router.push(`/play`);
    };

    const handleNewGame = () => {
        setLoading(true);

        for (const key of Object.keys(GameLocalStorageKeyEnum)) {
            const value = GameLocalStorageKeyEnum[key as keyof typeof GameLocalStorageKeyEnum];
            LocalStorageHelper.removeLocalStorageItem(value);
        }

        if (existingCode) {
            ManageRolesService.deleteRoles(existingCode);
        }

        router.push(`/play`);
    };

    const handleJoinAsSpy = () => {
        setLoading(true);

        router.push('/spy');
    };

    return (
        <div className="m-auto max-w-7xl flex justify-center items-center lg:gap-x-8 lg:px-8 min-h-screen">
            <div className="w-full h-full flex items-center justify-center px-6 lg:px-8 ">
                <div className="max-w-lg w-full flex items-center justify-center flex-col">
                    {existingCode && (
                        <button className="mb-10 lg:mb-16 w-fit" onClick={handleResumeGame}>
                            <div className="relative w-full flex flex-col md:flex-row gap-1 md:gap-2 rounded-full px-4 py-2 text-sm text-gray-200 bg-green-100/10 ring-1 ring-gray-100/20 hover:ring-gray-100/30">
                                <p className="hidden md:block">You already have an active game!</p>
                                <p className="whitespace-nowrap font-semibold text-green-400 hover:text-green-500 transition">
                                    Resume your game <span aria-hidden="true">&rarr;</span>
                                </p>
                            </div>
                        </button>
                    )}
                    <h1 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">
                        Quantum Code
                    </h1>
                    <p className="mt-8 text-lg font-medium text-gray-300 sm:text-xl text-center">
                        Embark on a journey of secrets and strategy. Retake your position as a
                        master spy or join a game to test your wits!
                    </p>
                    <div className="mt-10 flex flex-col md:flex-row items-center gap-y-4 gap-x-6">
                        <Button
                            size="lg"
                            onClick={handleNewGame}
                            isLoading={loading}
                            className="w-full md:w-fit bg-purple-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-purple-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-700"
                        >
                            New Game
                        </Button>
                        <Button
                            size="lg"
                            onClick={handleJoinAsSpy}
                            className="w-full md:w-fit bg-purple-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-purple-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-700"
                        >
                            Join as Spy
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
