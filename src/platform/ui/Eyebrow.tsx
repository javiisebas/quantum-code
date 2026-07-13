import { ClassnameHelper } from '@/platform/util/classnames';
import { ReactNode } from 'react';

/**
 * The small uppercase "eyebrow" label used above codes, sections and fields. It
 * appeared ~12× as five slightly different strings (`text-gray-400` vs `-500`, with
 * or without `font-semibold`, `tracking-widest` vs `[0.3em]`); this is the one recipe.
 *
 * It is BLOCK-level: an eyebrow always labels the thing beneath it, so it owns its line.
 * The default tag stays a `span` (safe to nest anywhere, e.g. inside a `<p>`), but the
 * `block` display is what makes that contract hold. Without it the tag is inline, and an
 * eyebrow next to another inline sibling (a big `<span>🏆</span>`, say) silently rides up
 * onto its line while its `mt-*`/`mb-*` — vertical margins don't apply to inline boxes —
 * is dropped on the floor. That bit the podium of every live game and the Werewolf role
 * card, and two call sites had already hand-patched it with a local `block`.
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
                'block text-xs font-semibold uppercase tracking-widest text-gray-400',
                className,
            )}
        >
            {children}
        </Tag>
    );
}
