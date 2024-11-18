'use client';

import { Icon } from '@/app/components/ui/Icon';
import { IconEnum } from '@/enum/icon.enum';
import { ClassnameHelper } from '@/helpers/clean-classname.helper';
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
