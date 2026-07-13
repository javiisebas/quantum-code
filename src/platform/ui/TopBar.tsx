'use client';

import { Button, IconButton } from '@/platform/ui/Button';
import { ClassnameHelper } from '@/platform/util/classnames';
import Link from 'next/link';
import { ReactNode } from 'react';
import { BiArrowBack, BiHome } from 'react-icons/bi';

/**
 * The one page header in the arcade: a back/home affordance on the left, the identity of what
 * you're looking at in the middle, and that screen's actions on the right.
 *
 * It exists because "Inicio" used to be a full-width BUTTON stacked at the bottom of the lobby,
 * below the primary CTA — competing with it for attention and adding a row of height to a screen
 * that already didn't fit. Navigation is chrome, not an action: it belongs in the corner, at a
 * fixed height, on every screen, in the same place.
 */
/**
 * An ACTION in the top bar — the one responsive control in the arcade.
 *
 * On `sm+` it is a labelled `secondary` button, like every other alternative action. Below `sm`
 * it collapses to an icon key, the same `rounded-xl` chip as the home key beside the title: a
 * phone header's width belongs to the game's name, and two labelled buttons used to eat it down
 * to "¿D…". The label never disappears semantically — it becomes the `aria-label` — and the
 * whole row reads as what it is: a strip of chrome keys.
 */
export function TopBarAction({
    icon,
    label,
    onPress,
}: {
    icon: ReactNode;
    /** The action's name: the visible label on `sm+`, the `aria-label` below it. */
    label: string;
    onPress: () => void;
}) {
    return (
        <>
            <IconButton size="md" aria-label={label} onPress={onPress} className="sm:hidden">
                {icon}
            </IconButton>
            <Button
                variant="secondary"
                size="md"
                startContent={icon}
                onPress={onPress}
                className="hidden sm:inline-flex"
            >
                {label}
            </Button>
        </>
    );
}

export function TopBar({
    emoji,
    title,
    back = '/',
    backLabel = 'Volver al inicio',
    variant = 'home',
    right,
    className,
}: {
    /** Game glyph, shown beside the title. */
    emoji?: string;
    title?: ReactNode;
    /**
     * Where the left affordance goes — or `null` for the ONE screen that is already there. The
     * home page rendering a house key that self-links is chrome with nothing to do.
     */
    back?: string | null;
    backLabel?: string;
    /** `home` = house icon (leaving a game), `back` = arrow (stepping back in a flow). */
    variant?: 'home' | 'back';
    /** Screen-specific actions (how-to-play, share…). */
    right?: ReactNode;
    className?: string;
}) {
    const Icon = variant === 'home' ? BiHome : BiArrowBack;
    return (
        <header
            className={ClassnameHelper.join(
                'flex h-12 shrink-0 items-center justify-between gap-3 sm:h-14',
                className,
            )}
        >
            <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
                {back !== null && (
                    <IconButton as={Link} href={back} aria-label={backLabel} size="md">
                        <Icon size={20} />
                    </IconButton>
                )}
                {(emoji || title) && (
                    <div className="flex min-w-0 items-center gap-2">
                        {emoji && (
                            <span className="text-xl sm:text-2xl" aria-hidden="true">
                                {emoji}
                            </span>
                        )}
                        {title && (
                            <h1 className="truncate text-base font-bold text-white sm:text-lg">
                                {title}
                            </h1>
                        )}
                    </div>
                )}
            </div>
            {right && <div className="flex shrink-0 items-center gap-2">{right}</div>}
        </header>
    );
}
