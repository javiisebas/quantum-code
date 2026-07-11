'use client';

import { Icon } from '@/app/components/ui/Icon';
import { useGame } from '@/contexts/GameContext';
import { useModal } from '@/contexts/ModalContext';
import { IconEnum } from '@/enum/icon.enum';
import { Button } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { FC } from 'react';
import { ModalCodeGameContent } from './ModalCodeGameContent';
import { ModalResetGameContent } from './ModalResetGameContent';
import { ModalRevealCardsGameContent } from './ModalRevealCardsGameContent';

export const GameBoardMenu: FC = () => {
    const { code, resetGame, revealAll } = useGame();
    const { openModal } = useModal();
    const router = useRouter();

    const menuBtns = [
        {
            icon: IconEnum.HOME,
            label: 'Home',
            onPress: () => router.push('/'),
        },
        {
            icon: IconEnum.EYE,
            label: 'Reveal cards',
            onPress: () => openModal(<ModalRevealCardsGameContent revealAll={revealAll} />),
        },
        {
            icon: IconEnum.CODE,
            label: 'Show code',
            onPress: () => openModal(<ModalCodeGameContent code={code} />),
        },
        {
            icon: IconEnum.REFRESH,
            label: 'Reset game',
            onPress: () => openModal(<ModalResetGameContent resetGame={resetGame} />),
        },
    ];

    return (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex justify-center gap-4">
            {menuBtns.map((btn) => (
                <Button
                    isIconOnly
                    key={btn.icon}
                    aria-label={btn.label}
                    onPress={btn.onPress}
                    size="lg"
                    radius="full"
                    className="text-white bg-purple-100/10 hover:bg-purple-100/20 ring-1 ring-gray-100/20 hover:ring-gray-100/30"
                >
                    <Icon name={btn.icon} />
                </Button>
            ))}
        </div>
    );
};
