'use client';

import { FLOATING_BAR, IconButton } from '@/platform/ui/IconButton';
import { useRouter } from 'next/navigation';
import { FC } from 'react';
import { BiHome, BiRefresh } from 'react-icons/bi';

export const SpyBoardMenu: FC = () => {
    const router = useRouter();

    return (
        <div className={FLOATING_BAR}>
            <IconButton
                label="Inicio"
                icon={<BiHome size={22} />}
                onPress={() => router.push('/')}
                placement="top"
            />
            <IconButton
                label="Unirse a otra partida"
                icon={<BiRefresh size={22} />}
                onPress={() => router.push('/join')}
                placement="top"
            />
        </div>
    );
};
