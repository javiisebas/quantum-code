'use client';

import { BarButton, FLOATING_BAR } from '@/platform/ui/FloatingBar';
import { useRouter } from 'next/navigation';
import { FC } from 'react';
import { BiHome, BiRefresh } from 'react-icons/bi';

export const SpyBoardMenu: FC = () => {
    const router = useRouter();

    return (
        <div className={FLOATING_BAR}>
            <BarButton
                label="Inicio"
                icon={<BiHome size={22} />}
                onPress={() => router.push('/')}
                placement="top"
            />
            <BarButton
                label="Unirse a otra partida"
                icon={<BiRefresh size={22} />}
                onPress={() => router.push('/join')}
                placement="top"
            />
        </div>
    );
};
