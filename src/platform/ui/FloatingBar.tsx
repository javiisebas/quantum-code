'use client';

import { IconButton } from '@/platform/ui/Button';
import { Tooltip } from '@heroui/react';
import { forwardRef, ReactNode } from 'react';

/**
 * Chrome for the game's floating control clusters (Codenames' board HUD, dock and spy menu).
 *
 * The BAR is what's special here — squared, glass, "Apple-dock" style — not the buttons in it.
 * The buttons are the app's one `<IconButton>` wearing its `bar` surface, so a dock key and the
 * TopBar's home key are now literally the same control with the same focus ring, hover and press.
 * (They used to be two hand-rolled recipes that had drifted apart.) What `BarButton` still owns is
 * the one thing a dock genuinely needs and no other icon button does: a TOOLTIP, because an
 * icon-only action is only legitimate when something names it.
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
            <IconButton
                ref={ref}
                surface="bar"
                tone={danger ? 'danger' : 'default'}
                aria-label={label}
                onPress={onPress}
            >
                {icon}
            </IconButton>
        </Tooltip>
    );
});
