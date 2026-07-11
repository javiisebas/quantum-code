'use client';

import { Icon } from '@/app/components/ui/Icon';
import { IconEnum } from '@/enum/icon.enum';
import { Button } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { FC } from 'react';

export const SpyBoardMenu: FC = () => {
    const router = useRouter();

    const menuBtns = [
        {
            icon: IconEnum.HOME,
            label: 'Home',
            onPress: () => router.push('/'),
        },
        {
            icon: IconEnum.REFRESH,
            label: 'New spy board',
            onPress: () => router.push('/spy'),
        },
    ];

    return (
        <div className="flex justify-center gap-4 mt-6">
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
