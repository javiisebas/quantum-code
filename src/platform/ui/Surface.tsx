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
type SurfaceTone = 'panel' | 'inset' | 'plain';

const TONE: Record<SurfaceTone, string> = {
    panel: 'bg-gray-900/80 ring-1 ring-inset ring-white/10 backdrop-blur-sm',
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
