import { ClassnameHelper } from '@/platform/util/classnames';
import { ReactNode } from 'react';

/**
 * The small uppercase "eyebrow" label used above codes, sections and fields. It
 * appeared ~12× as five slightly different strings (`text-gray-400` vs `-500`, with
 * or without `font-semibold`, `tracking-widest` vs `[0.3em]`); this is the one recipe.
 */
export function Eyebrow({
    children,
    className,
    as: Tag = 'span',
}: {
    children: ReactNode;
    className?: string;
    as?: 'span' | 'p' | 'legend' | 'h2';
}) {
    return (
        <Tag
            className={ClassnameHelper.join(
                'text-xs font-semibold uppercase tracking-widest text-gray-400',
                className,
            )}
        >
            {children}
        </Tag>
    );
}
