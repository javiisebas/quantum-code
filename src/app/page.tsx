'use client';

import { deleteBoard } from '@/app/api/roles/services/manage-board.service';
import { ModalHowToPlayContent } from '@/app/components/ModalHowToPlayContent';
import { PrimaryButton } from '@/app/components/ui/Button';
import { GAME_STORAGE_KEY, PersistedGame } from '@/contexts/game-state';
import { useModal } from '@/contexts/ModalContext';
import { GameStatusEnum } from '@/enum/game-status.enum';
import { usePersistedState } from '@/hooks/usePersistedState';
import { Button } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function HomePage() {
    const [game, setGame, hydrated] = usePersistedState<PersistedGame | null>(
        GAME_STORAGE_KEY,
        null,
    );
    const [loading, setLoading] = useState(false);
    const { openModal } = useModal();
    const router = useRouter();

    const canResume = hydrated && game?.status === GameStatusEnum.PLAYING && !!game.code;

    const handleResumeGame = () => {
        router.push('/play');
    };

    const handleNewGame = () => {
        setLoading(true);
        // Release the previous board (if any) and clear local state so /play boots fresh.
        if (game?.code) deleteBoard(game.code).catch(() => {});
        setGame(null);
        router.push('/play');
    };

    const handleJoinAsSpy = () => {
        router.push('/spy');
    };

    const handleHowToPlay = () => {
        openModal(<ModalHowToPlayContent />);
    };

    return (
        <div className="m-auto max-w-7xl flex justify-center items-center lg:gap-x-8 lg:px-8 min-h-screen">
            <div className="w-full h-full flex items-center justify-center px-6 lg:px-8 ">
                <div className="max-w-lg w-full flex items-center justify-center flex-col">
                    {canResume && (
                        <button
                            type="button"
                            aria-label="Reanudar tu partida activa"
                            className="mb-10 lg:mb-16 w-fit"
                            onClick={handleResumeGame}
                        >
                            <div className="relative w-full flex flex-col md:flex-row gap-1 md:gap-2 rounded-full px-4 py-2 text-sm text-gray-200 bg-green-100/10 ring-1 ring-gray-100/20 hover:ring-gray-100/30">
                                <p className="hidden md:block">¡Ya tienes una partida activa!</p>
                                <p className="whitespace-nowrap font-semibold text-green-400 hover:text-green-500 transition">
                                    Reanudar partida <span aria-hidden="true">&rarr;</span>
                                </p>
                            </div>
                        </button>
                    )}
                    <h1 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">
                        Quantum Code
                    </h1>
                    <p className="mt-8 text-lg font-medium text-gray-300 sm:text-xl text-center">
                        Un juego de secretos y estrategia. Retoma tu papel de espía maestro o únete a
                        una partida para poner a prueba tu ingenio.
                    </p>
                    <div className="mt-10 w-full flex flex-col md:flex-row items-center justify-center gap-y-4 gap-x-6">
                        <PrimaryButton
                            onPress={handleNewGame}
                            isLoading={loading}
                            className="w-full md:w-fit"
                        >
                            Nueva partida
                        </PrimaryButton>
                        <PrimaryButton onPress={handleJoinAsSpy} className="w-full md:w-fit">
                            Unirse como espía
                        </PrimaryButton>
                    </div>
                    <Button
                        variant="light"
                        className="mt-6 text-gray-300 hover:text-white"
                        onPress={handleHowToPlay}
                    >
                        ¿Cómo se juega?
                    </Button>
                </div>
            </div>
        </div>
    );
}
