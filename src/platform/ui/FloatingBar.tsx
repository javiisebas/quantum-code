'use client';

import { ClassnameHelper } from '@/platform/util/classnames';
import { Tooltip } from '@heroui/react';
import { forwardRef, ReactNode } from 'react';

/**
 * Chrome for the game's floating control clusters (board HUD, dock, spy menu).
 *
 * These bars are a distinct pattern from a standalone round `IconButton` (see
 * `Button.tsx`): they're squared, tooltip-labelled, and grouped inside one glass bar,
 * "Apple-dock" style. Keeping their button (`BarButton`), separator (`BarDivider`) and
 * bar surface (`FLOATING_BAR`) here — under their own name — is what lets every floating
 * cluster share the exact same shape while staying clearly separate from the generic
 * icon button used elsewhere (steppers, scanner close…).
 */

/** The shared "glass bar" surface for every floating control cluster. */
export const FLOATING_BAR =
    'flex items-center gap-1 rounded-2xl bg-gray-900/70 p-2 shadow-2xl shadow-black/40 ring-1 ring-white/10 backdrop-blur-md';

/** A thin vertical separator for use inside a FLOATING_BAR. */
export const BarDivider = () => <span className="mx-1 h-6 w-px bg-white/10" aria-hidden="true" />;

export interface BarButtonProps {
    /** Accessible name + tooltip label. */
    label: string;
    icon: ReactNode;
    onPress: () => void;
    /** Destructive actions get a red-tinted hover. */
    danger?: boolean;
    /** Tooltip side (bars at the top point their tooltips down, and vice-versa). */
    placement?: 'top' | 'bottom';
}

export const BarButton = forwardRef<HTMLButtonElement, BarButtonProps>(function BarButton(
    { label, icon, onPress, danger = false, placement = 'top' },
    ref,
) {
    return (
        <Tooltip
            content={label}
            placement={placement}
            delay={150}
            closeDelay={0}
            classNames={{
                content:
                    'rounded-lg bg-gray-950/95 px-2.5 py-1 text-xs font-medium text-white shadow-xl ring-1 ring-white/10',
            }}
        >
            <button
                ref={ref}
                type="button"
                aria-label={label}
                onClick={onPress}
                className={ClassnameHelper.join(
                    'flex h-11 w-11 items-center justify-center rounded-xl text-gray-300 transition-all duration-200',
                    'hover:-translate-y-0.5 hover:bg-white/10 hover:text-white active:scale-90',
                    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40',
                    danger && 'hover:bg-rose-500/15 hover:text-rose-300',
                )}
            >
                {icon}
            </button>
        </Tooltip>
    );
});
