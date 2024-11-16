'use client';

import { Icon } from '@/app/components/ui/Icon';
import { useGame } from '@/contexts/GameContext';
import { useModal } from '@/contexts/ModalContext';
import { IconEnum } from '@/enum/icon.enum';
import { ClassnameHelper } from '@/helpers/clean-classname.helper';
import { Button } from '@nextui-org/react';
import { useRouter } from 'next/navigation'; // Importa useRouter
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
            color: 'border-teal-300 bg-teal-100 hover:bg-teal-200/80 text-teal-500',
        },
        {
            icon: IconEnum.EYE,
            onClick: () => openModal(<ModalRevealCardsGameContent revealAll={revealAll} />),
            color: 'border-violet-300 bg-violet-100 hover:bg-violet-200/80 text-violet-500',
        },
        {
            icon: IconEnum.CODE,
            onClick: () => openModal(<ModalCodeGameContent code={code} />),
            color: 'border-violet-300 bg-violet-100 hover:bg-violet-200/80 text-violet-500',
        },
        {
            icon: IconEnum.REFRESH,
            onClick: () => openModal(<ModalResetGameContent resetGame={resetGame} />),
            color: 'border-red-300 bg-red-100 hover:bg-red-200/80 text-red-500',
        },
    ];

    return (
        <div className="flex justify-center gap-4 mt-6">
            {menuBtns.map((btn, index) => (
                <Button
                    isIconOnly
                    key={index}
                    onClick={btn.onClick}
                    size="lg"
                    radius="full"
                    className={ClassnameHelper.join('border-2', btn.color)}
                >
                    <Icon name={btn.icon} />
                </Button>
            ))}
        </div>
    );
};
