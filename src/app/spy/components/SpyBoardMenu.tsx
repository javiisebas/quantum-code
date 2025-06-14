'use client';

import { Icon } from '@/app/components/ui/Icon';
import { IconEnum } from '@/enum/icon.enum';
import { Button } from '@nextui-org/react';
import { useRouter } from 'next/navigation';
import { FC } from 'react';

export const SpyBoardMenu: FC = () => {
    const router = useRouter();

    const menuBtns = [
        {
            icon: IconEnum.HOME,
            onClick: () => router.push('/'),
            color: 'border-teal-300 bg-teal-100 hover:bg-teal-200/80 text-teal-500',
        },
        {
            icon: IconEnum.REFRESH,
            onClick: () => router.push('/spy'),
            color: 'border-red-300 bg-red-100 outline-red-100 hover:bg-red-100/90 text-red-500',
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
                    className="text-white bg-purple-100/10 hover:bg-purple-100/20 ring-1 ring-gray-100/20 hover:ring-gray-100/30"
                >
                    <Icon name={btn.icon} />
                </Button>
            ))}
        </div>
    );
};
