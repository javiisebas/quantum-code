'use client';

import { useGame } from '@/contexts/GameContext';
import { FC } from 'react';

interface TeamPillProps {
    label: string;
    found: number;
    total: number;
    dotClass: string;
    textClass: string;
}

const TeamPill: FC<TeamPillProps> = ({ label, found, total, dotClass, textClass }) => {
    const remaining = Math.max(total - found, 0);
    return (
        <div
            className="flex items-center gap-2 rounded-full bg-gray-900/70 px-3 py-1.5 ring-1 ring-white/10 backdrop-blur"
            aria-label={`${label}: quedan ${remaining} de ${total}`}
        >
            <span className={`h-2.5 w-2.5 rounded-full ${dotClass}`} aria-hidden="true" />
            <span className="text-xs font-medium text-gray-300">{label}</span>
            <span className={`text-sm font-bold tabular-nums ${textClass}`}>
                {remaining}
                <span className="text-gray-500">/{total}</span>
            </span>
        </div>
    );
};

/**
 * Cards still to find per team — the one piece of running state that's genuinely
 * actionable on the shared board. Turn order stays verbal (as in tabletop
 * Codenames), so it is intentionally not tracked here.
 */
export const GameBoardScore: FC = () => {
    const { progress } = useGame();

    return (
        <div className="absolute top-6 left-1/2 z-20 flex -translate-x-1/2 gap-3">
            <TeamPill
                label="Azul"
                found={progress.blue.found}
                total={progress.blue.total}
                dotClass="bg-sky-400"
                textClass="text-sky-300"
            />
            <TeamPill
                label="Rojo"
                found={progress.red.found}
                total={progress.red.total}
                dotClass="bg-rose-400"
                textClass="text-rose-300"
            />
        </div>
    );
};
