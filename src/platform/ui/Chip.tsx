import { ClassnameHelper } from '@/platform/util/classnames';
import { ReactNode } from 'react';

/**
 * Small rounded label/badge. Unifies the ~6 pill recipes (player count, duration,
 * "connected players", location tags) into one shape. `tone="neutral"` is the frosted
 * default; pass `className` for a coloured tint (e.g. an accent or team colour).
 */
export function Chip({
    children,
    tone = 'neutral',
    className,
}: {
    children: ReactNode;
    tone?: 'neutral' | 'bare';
    className?: string;
}) {
    return (
        <span
            className={ClassnameHelper.join(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium',
                tone === 'neutral' && 'bg-white/5 text-gray-300 ring-1 ring-inset ring-white/10',
                className,
            )}
        >
            {children}
        </span>
    );
}
