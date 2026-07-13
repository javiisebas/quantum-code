import { ClassnameHelper } from '@/platform/util/classnames';
import { ElementType, HTMLAttributes, ReactNode } from 'react';

/**
 * The one frosted-glass container used across the app. Before this, ~9 slightly
 * different recipes drifted on opacity (`/70`–`/95`), ring, blur and padding; every
 * panel now shares the SAME surface so the UI reads as one system.
 *
 *  - `tone="panel"`   → the default dark glass card (`bg-gray-900/80` + inset ring).
 *  - `tone="inset"`   → a subtle sub-panel sitting *inside* another surface (`bg-white/5`).
 *  - `tone="plain"`   → structure only (radius/ring), caller supplies its own background
 *                       (e.g. a game's tinted "you are the spy" card).
 */
type SurfaceTone = 'panel' | 'solid' | 'inset' | 'plain';

const TONE: Record<SurfaceTone, string> = {
    panel: 'bg-gray-900/80 ring-1 ring-inset ring-white/10 backdrop-blur-sm',
    // Fully opaque — for a panel that sits ON TOP of content it must stay legible against, without
    // dimming or blurring what's behind it (the Codenames verdict over a revealed board: the board
    // is the reveal, so hiding it to make the card readable trades away the thing people lean in
    // to see). Frosted glass only works over the app's dark background.
    solid: 'bg-gray-900 ring-1 ring-inset ring-white/10',
    inset: 'bg-white/5 ring-1 ring-inset ring-white/10',
    plain: 'ring-1 ring-inset ring-white/10',
};

interface SurfaceProps extends HTMLAttributes<HTMLElement> {
    as?: ElementType;
    tone?: SurfaceTone;
    /** Corner radius token. Panels use `3xl`; tighter chrome uses `2xl`. */
    radius?: '3xl' | '2xl' | 'xl';
    children?: ReactNode;
}

const RADIUS = { '3xl': 'rounded-3xl', '2xl': 'rounded-2xl', xl: 'rounded-xl' } as const;

export function Surface({
    as: Tag = 'div',
    tone = 'panel',
    radius = '3xl',
    className,
    children,
    ...rest
}: SurfaceProps) {
    return (
        <Tag className={ClassnameHelper.join(RADIUS[radius], TONE[tone], className)} {...rest}>
            {children}
        </Tag>
    );
}
