'use client';

import { useGame } from '@/games/codenames/GameContext';
import { ModalHowToPlayContent } from '@/games/codenames/components/ModalHowToPlayContent';
import { CODENAMES_ID, codenamesManifest } from '@/games/codenames/manifest';
import { ConfirmModal } from '@/platform/ui/ConfirmModal';
import { useModal } from '@/platform/ui/modal-context';
import { ShareModal } from '@/platform/ui/ShareModal';
import { ClassnameHelper } from '@/platform/util/classnames';
import { useRouter } from 'next/navigation';
import { FC, ReactNode } from 'react';
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
            onPress: () =>
                openModal(
                    <ShareModal code={code} game={CODENAMES_ID} gameName={codenamesManifest.name} />,
                ),
        },
        {
            id: 'how-to-play',
            icon: <BiHelpCircle size={22} />,
            label: 'Cómo se juega',
            onPress: () => openModal(<ModalHowToPlayContent />),
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
                        onConfirm={resetGame}
                    />,
                ),
        },
    ];

    return (
        <div className="absolute bottom-8 left-1/2 z-20 -translate-x-1/2">
            <div className="flex items-center gap-1 rounded-2xl bg-gray-900/70 p-2 shadow-2xl shadow-black/40 ring-1 ring-white/10 backdrop-blur-md">
                {items.map((item) => (
                    <div key={item.id} className="flex items-center">
                        {item.dividerBefore && (
                            <span className="mx-1 h-6 w-px bg-white/10" aria-hidden="true" />
                        )}
                        <button
                            type="button"
                            aria-label={item.label}
                            title={item.label}
                            onClick={item.onPress}
                            className={ClassnameHelper.join(
                                'flex h-11 w-11 items-center justify-center rounded-xl text-gray-300 transition-all duration-200',
                                'hover:-translate-y-0.5 hover:bg-white/10 hover:text-white active:scale-90',
                                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40',
                                item.danger && 'hover:bg-rose-500/15 hover:text-rose-300',
                            )}
                        >
                            {item.icon}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};
