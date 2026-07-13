'use client';

import { ClassnameHelper } from '@/platform/util/classnames';
import { forwardRef, type InputHTMLAttributes } from 'react';

/**
 * The app's slider. It is the one genuinely bespoke control in the arcade (Sintonía's dial), but
 * it was also the last one still hard-coding a colour (`accent-cyan-400`) instead of taking it
 * from the game's token — so a re-themed game would have kept a cyan dial.
 *
 * The native `accent-color` is passed in as `accentClass` (e.g. `accentOf(...).range`), the same
 * contract `<Button variant="accent">` uses, which keeps `platform/` free of game colour tokens.
 */
export interface RangeInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
    /** Native control tint, e.g. `accent-cyan-400`. */
    accentClass?: string;
}

export const RangeInput = forwardRef<HTMLInputElement, RangeInputProps>(function RangeInput(
    { accentClass, className, ...props },
    ref,
) {
    return (
        <input
            ref={ref}
            type="range"
            className={ClassnameHelper.join(
                'h-2 w-full cursor-pointer appearance-none rounded-full bg-white/15 outline-none',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/40',
                accentClass,
                className,
            )}
            {...props}
        />
    );
});
