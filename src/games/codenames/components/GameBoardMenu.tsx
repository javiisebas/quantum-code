'use client';

import { useGame } from '@/games/codenames/GameContext';
import { codenamesManifest } from '@/games/codenames/manifest';
import { ConfirmModal } from '@/platform/ui/ConfirmModal';
import { BarDivider, FLOATING_BAR, BarButton } from '@/platform/ui/FloatingBar';
import { HowToPlayModal } from '@/platform/ui/HowToPlay';
import { useModal } from '@/platform/ui/modal-context';
import { ShareModal } from '@/platform/ui/ShareModal';
import { useRouter } from 'next/navigation';
import { FC, Fragment, ReactNode } from 'react';
import { BiHelpCircle, BiHome, BiQr, BiRefresh, BiShow } from 'react-icons/bi';

interface DockItem {
    id: string;
    icon: ReactNode;
    label: string;
    onPress: () => void;
    danger?: boolean;
    dividerBefore?: boolean;
}

/**
 * Board dock — a floating, frosted "Apple-dock" style menu. Icon-only actions with a
 * hover lift and tooltips, grouped in one glass bar; the destructive "new game" action
 * is set apart by a divider and a red-tinted hover.
 */
export const GameBoardMenu: FC = () => {
    const { code, resetGame, revealAll } = useGame();
    const { openModal } = useModal();
    const router = useRouter();

    const items: DockItem[] = [
        {
            id: 'home',
            icon: <BiHome size={22} />,
            label: 'Inicio',
            onPress: () => router.push('/'),
        },
        {
            id: 'share',
            icon: <BiQr size={22} />,
            label: 'Compartir partida',
            onPress: () => openModal(<ShareModal code={code} gameName={codenamesManifest.name} />),
        },
        {
            id: 'how-to-play',
            icon: <BiHelpCircle size={22} />,
            label: 'Cómo se juega',
            // The same rules modal the other seven games show, fed from the manifest — this dock
            // used to open a bespoke one only Codenames had.
            onPress: () => openModal(<HowToPlayModal manifest={codenamesManifest} />),
        },
        {
            id: 'reveal',
            icon: <BiShow size={22} />,
            label: 'Revelar cartas',
            onPress: () =>
                openModal(
                    <ConfirmModal
                        title="Revelar todas las cartas"
                        message="Se mostrará el color de todas las palabras y la partida terminará. ¿Continuar?"
                        confirmLabel="Revelar"
                        confirmIcon={<BiShow size={18} />}
                        onConfirm={revealAll}
                    />,
                ),
        },
        {
            id: 'reset',
            icon: <BiRefresh size={22} />,
            label: 'Nueva partida',
            danger: true,
            dividerBefore: true,
            onPress: () =>
                openModal(
                    <ConfirmModal
                        title="Nueva partida"
                        message="Se generará un código nuevo y se perderá la partida actual. ¿Empezar de nuevo?"
                        confirmLabel="Empezar de nuevo"
                        confirmIcon={<BiRefresh size={18} />}
                        // The one irreversible action in the arcade: it throws the current game
                        // away. The dock key is already red on hover; its confirm says so too.
                        destructive
                        onConfirm={resetGame}
                    />,
                ),
        },
    ];

    return (
        <div className="absolute bottom-8 left-1/2 z-20 -translate-x-1/2">
            <div className={FLOATING_BAR}>
                {items.map((item) => (
                    <Fragment key={item.id}>
                        {item.dividerBefore && <BarDivider />}
                        <BarButton
                            label={item.label}
                            icon={item.icon}
                            onPress={item.onPress}
                            danger={item.danger}
                            placement="top"
                        />
                    </Fragment>
                ))}
            </div>
        </div>
    );
};
