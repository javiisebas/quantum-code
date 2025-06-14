'use client';

import { Icon } from '@/app/components/ui/Icon';
import { useGame } from '@/contexts/GameContext';
import { useModal } from '@/contexts/ModalContext';
import { IconEnum } from '@/enum/icon.enum';
import { Button } from '@nextui-org/react';
import { useRouter } from 'next/navigation';
import { FC } from 'react';
import { ModalCodeGameContent } from './ModalCodeGameContent';
import { ModalResetGameContent } from './ModalResetGameContent';
import { ModalRevealCardsGameContent } from './ModalRevelCardsGameContent';

export const GameBoardMenu: FC = () => {
    const { code, resetGame, revealAll } = useGame();
    const { openModal } = useModal();
    const router = useRouter();

    const menuBtns = [
        {
            icon: IconEnum.HOME,
            onClick: () => router.push('/'),
            color: 'border-teal-300 bg-teal-100 outline-teal-100 hover:bg-teal-100/90 text-teal-500',
        },
        {
            icon: IconEnum.EYE,
            onClick: () => openModal(<ModalRevealCardsGameContent revealAll={revealAll} />),
            color: 'border-purple-700 bg-purple-100 outline-purple-100 hover:bg-purple-100/90 text-purple-700',
        },
        {
            icon: IconEnum.CODE,
            onClick: () => openModal(<ModalCodeGameContent code={code} />),
            color: 'border-purple-700 bg-purple-100 outline-purple-100 hover:bg-purple-100/90 text-purple-700',
        },
        {
            icon: IconEnum.REFRESH,
            onClick: () => openModal(<ModalResetGameContent resetGame={resetGame} />),
            color: 'border-red-300 bg-red-100 outline-red-100 hover:bg-red-100/90 text-red-500',
        },
    ];

    return (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex justify-center gap-4">
            {menuBtns.map((btn, index) => (
                <Button
                    isIconOnly
                    key={index}
                    onClick={btn.onClick}
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
