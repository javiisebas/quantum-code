'use client';

import { ModalHowToPlayContent } from '@/games/codenames/components/ModalHowToPlayContent';
import { Icon } from '@/platform/ui/Icon';
import { useGame } from '@/games/codenames/GameContext';
import { useModal } from '@/platform/ui/modal-context';
import { IconEnum } from '@/platform/ui/icon-enum';
import { Button } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { FC, ReactNode } from 'react';
import { BiHelpCircle } from 'react-icons/bi';
import { ModalCodeGameContent } from './ModalCodeGameContent';
import { ModalResetGameContent } from './ModalResetGameContent';
import { ModalRevealCardsGameContent } from './ModalRevealCardsGameContent';

interface MenuButton {
    id: string;
    icon: ReactNode;
    label: string;
    onPress: () => void;
}

export const GameBoardMenu: FC = () => {
    const { code, resetGame, revealAll } = useGame();
    const { openModal } = useModal();
    const router = useRouter();

    const menuBtns: MenuButton[] = [
        {
            id: 'home',
            icon: <Icon name={IconEnum.HOME} />,
            label: 'Inicio',
            onPress: () => router.push('/'),
        },
        {
            id: 'share',
            icon: <Icon name={IconEnum.CODE} />,
            label: 'Compartir partida',
            onPress: () => openModal(<ModalCodeGameContent code={code} />),
        },
        {
            id: 'how-to-play',
            icon: <BiHelpCircle size={24} />,
            label: 'Cómo se juega',
            onPress: () => openModal(<ModalHowToPlayContent />),
        },
        {
            id: 'reveal',
            icon: <Icon name={IconEnum.EYE} />,
            label: 'Revelar cartas',
            onPress: () => openModal(<ModalRevealCardsGameContent revealAll={revealAll} />),
        },
        {
            id: 'reset',
            icon: <Icon name={IconEnum.REFRESH} />,
            label: 'Nueva partida',
            onPress: () => openModal(<ModalResetGameContent resetGame={resetGame} />),
        },
    ];

    return (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex justify-center gap-4">
            {menuBtns.map((btn) => (
                <Button
                    isIconOnly
                    key={btn.id}
                    aria-label={btn.label}
                    title={btn.label}
                    onPress={btn.onPress}
                    size="lg"
                    radius="full"
                    className="text-white bg-purple-100/10 hover:bg-purple-100/20 ring-1 ring-gray-100/20 hover:ring-gray-100/30"
                >
                    {btn.icon}
                </Button>
            ))}
        </div>
    );
};
