'use client';

import { Icon } from '@/platform/ui/Icon';
import { IconEnum } from '@/platform/ui/icon-enum';
import { Button } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { FC } from 'react';

export const SpyBoardMenu: FC = () => {
    const router = useRouter();

    const menuBtns = [
        {
            icon: IconEnum.HOME,
            label: 'Inicio',
            onPress: () => router.push('/'),
        },
        {
            icon: IconEnum.REFRESH,
            label: 'Unirse a otra partida',
            onPress: () => router.push('/join'),
        },
    ];

    return (
        <div className="flex justify-center gap-4">
            {menuBtns.map((btn, index) => (
                <Button
                    isIconOnly
                    key={index}
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
