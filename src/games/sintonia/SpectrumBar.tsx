import { ClassnameHelper } from '@/platform/util/classnames';
import { FC } from 'react';
import type { Spectrum } from './spectrums';

interface SpectrumBarProps {
    spectrum: Spectrum;
    /** 0–100 target centre; when set, draws the bullseye bands (4/3/2-point zones). */
    target?: number | null;
    /** 0–100 dial position; when set, draws the needle. */
    dial?: number | null;
}

/** A scoring band centred on `target`, clamped to the track. */
const band = (target: number, half: number, className: string) => {
    const left = Math.max(0, target - half);
    const right = Math.min(100, target + half);
    return (
        <div
            className={ClassnameHelper.join('absolute inset-y-0 rounded-full', className)}
            style={{ left: `${left}%`, width: `${right - left}%` }}
        />
    );
};

/**
 * The Sintonía spectrum: a track between two opposite poles, with an optional bullseye
 * (the secret target zone, shown only to the psychic / at reveal) and an optional dial
 * needle (the team's guess). Bands mirror the scoring: ±4 → 4pts, ±9 → 3pts, ±16 → 2pts.
 */
export const SpectrumBar: FC<SpectrumBarProps> = ({ spectrum, target = null, dial = null }) => (
    <div className="w-full">
        <div className="relative h-14 w-full overflow-hidden rounded-2xl bg-white/5 ring-1 ring-inset ring-white/10">
            {target !== null && (
                <>
                    {band(target, 16, 'bg-cyan-400/15')}
                    {band(target, 9, 'bg-cyan-400/30')}
                    {band(target, 4, 'bg-cyan-300/70')}
                </>
            )}
            {dial !== null && (
                <div
                    className="absolute inset-y-0 z-10 flex -translate-x-1/2 flex-col items-center"
                    style={{ left: `${dial}%` }}
                >
                    <div className="h-0 w-0 border-x-[6px] border-t-[8px] border-x-transparent border-t-white" />
                    <div className="h-full w-0.5 bg-white shadow" />
                </div>
            )}
        </div>
        <div className="mt-2 flex justify-between text-sm font-semibold">
            <span className="text-cyan-200">◀ {spectrum.left}</span>
            <span className="text-cyan-200">{spectrum.right} ▶</span>
        </div>
    </div>
);
