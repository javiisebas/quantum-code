'use client';

import { ClassnameHelper } from '@/platform/util/classnames';
import { Button as HeroButton, ButtonProps as HeroButtonProps } from '@heroui/react';
import { FC, forwardRef } from 'react';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * THE BUTTON SYSTEM — the one rule for every actionable thing in the arcade.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * A control looks the way it does because of the KIND of action it is, and for no other reason.
 * Not because of which screen it landed on, not because of who wrote it. Two controls that do the
 * same kind of job must be indistinguishable across all eight games.
 *
 * VARIANT — what kind of action is this?
 *
 *  - `primary`   → THE action of the screen, on PLATFORM chrome (join, errors, modals, 404).
 *                  Purple is the arcade's own colour. Exactly one per screen — and if a screen
 *                  offers only one action at all, that action IS the primary.
 *  - `accent`    → the same role INSIDE a game, in that game's colour: pass `accentClass` from
 *                  `accentOf(...).solidButton`. A game screen's one CTA is `accent`, never purple.
 *                  Keeps `platform/` free of game colour tokens.
 *  - `secondary` → EVERY alternative to that one action, without exception: cancel, go home,
 *                  reveal the cards, scan a QR, copy, share, reload, read the rules. All the
 *                  alternatives on a screen are the SAME variant as each other. The moment one of
 *                  them is a text link and the one below it is an outlined button, they stop
 *                  reading as two of the same kind of thing — which is the bug this system exists
 *                  to kill.
 *  - `danger`    → a destructive confirm, and ONLY inside `<ConfirmModal destructive>`. Red means
 *                  "this cannot be undone"; it is never one of two options on an ordinary screen.
 *
 * There is deliberately NO text-link variant. If an action is worth putting on the screen, it is
 * worth looking like a button.
 *
 * SIZE — what is its role, not where does it happen to sit?
 *
 *  - `lg`   → an action the screen is ASKING you to take: every primary/accent CTA, and every
 *             alternative standing beside one. The default; use it unless you know otherwise.
 *  - `md`   → a SUPPORTING control: chrome in the `TopBar` (a 48px button in a 48px header leaves
 *             no header) and utility rows bolted to content (copy/share the join link). Never the
 *             answer to "what do I do on this screen?".
 *  - `hero` → the single urgent tap a phone game is built around (La Bomba's "¡Pasar!"). It is a
 *             SIZE, not a licence to restyle — it lives in here so no call site hand-rolls `h-24`.
 *
 * `sm` is not in the type. `sm` is what the drift looked like.
 *
 * ICONS — an icon with no label is only legitimate in three places, all of which name it some
 * other way: `IconButton surface="raised"` for universal glyphs (home, back, +/−, close),
 * `IconButton surface="bar"` inside a `FLOATING_BAR`, where a tooltip supplies the name, and a
 * `TopBarAction` below `sm`, where every header action collapses to an icon key (`aria-label`ed)
 * because the header's width belongs to the title. Anywhere else, an action carries its label.
 *
 * Pass only LAYOUT utilities (width, min-width, margins) through `className`; colour and size
 * utilities collide with the recipes below.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'accent';
export type ButtonSize = 'md' | 'lg' | 'hero';

/**
 * One focus ring, one geometry, everywhere. Purple on the app's neutral surfaces; white where the
 * control sits ON colour (the Codenames board, a live camera feed, the floating dock) and purple
 * would clash or vanish. Exported because the two raw `<button>`s that no variant can express —
 * the Codenames flip-card and Chispas' vote options — must still focus like everything else.
 */
export const FOCUS_RING =
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-500';
export const FOCUS_RING_LIGHT =
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70';

/**
 * One coherent disabled look for every variant. HeroUI's default is only `opacity-disabled`
 * (~0.5), which on a light accent (yellow/lime/amber) reads as a washed-out solid rather than
 * clearly "off" — a contrast/a11y problem on the dark bg (e.g. the live lobby's "Empezar" CTA).
 * Instead we drop the accent entirely for a muted neutral surface and restore full opacity.
 * Applied last in the class list; the `data-[disabled=true]:` variants also outrank HeroUI's
 * internal `opacity-disabled` by specificity, so they win regardless of stylesheet order.
 */
const DISABLED =
    'data-[disabled=true]:cursor-not-allowed data-[disabled=true]:bg-white/5 data-[disabled=true]:text-white/40 data-[disabled=true]:shadow-none data-[disabled=true]:opacity-100';

const VARIANT: Record<ButtonVariant, string> = {
    primary: `bg-purple-600 font-semibold text-white shadow-lg shadow-purple-950/40 hover:bg-purple-500 ${FOCUS_RING}`,
    accent: `font-semibold text-white shadow-lg shadow-black/20 ${FOCUS_RING}`,
    danger: `bg-rose-600 font-semibold text-white shadow-lg shadow-rose-950/40 hover:bg-rose-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500`,
    secondary: `border-white/15 font-medium text-white hover:bg-white/5 ${FOCUS_RING}`,
};

/** HeroUI's own `variant` per intent — controls the base fill/outline it renders. */
const HERO_VARIANT: Record<ButtonVariant, HeroButtonProps['variant']> = {
    primary: 'solid',
    accent: 'solid',
    danger: 'solid',
    secondary: 'bordered',
};

/** `hero` is HeroUI's `lg` grown into the tap target a panicking thumb can't miss. */
const HERO_SIZE: Record<ButtonSize, HeroButtonProps['size']> = {
    md: 'md',
    lg: 'lg',
    hero: 'lg',
};

const SIZE: Partial<Record<ButtonSize, string>> = {
    hero: 'h-24 text-3xl font-extrabold short:h-20',
};

export interface ButtonProps extends Omit<HeroButtonProps, 'variant' | 'color' | 'size'> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    /** Accent solid-fill classes for `variant="accent"` (e.g. `bg-rose-600 hover:bg-rose-500`). */
    accentClass?: string;
    fullWidth?: boolean;
}

export const Button: FC<ButtonProps> = ({
    variant = 'primary',
    accentClass,
    fullWidth,
    className,
    radius = 'lg',
    size = 'lg',
    ...props
}) => (
    <HeroButton
        size={HERO_SIZE[size]}
        radius={radius}
        variant={HERO_VARIANT[variant]}
        disableRipple
        className={ClassnameHelper.join(
            // One control radius across the app: buttons match inputs/code cells (rounded-xl).
            'rounded-xl transition active:scale-[0.98]',
            VARIANT[variant],
            SIZE[size],
            variant === 'accent' && accentClass,
            fullWidth && 'w-full',
            className,
            // Disabled treatment wins over the variant fill (and HeroUI's own default).
            DISABLED,
        )}
        {...props}
    />
);

/**
 * The app's ONE icon-only control. Every round/square icon key in the arcade is this component:
 * the TopBar's home, the player stepper, the scanner's close, and — via `<BarButton>` — every key
 * in Codenames' dock and score HUD. There used to be two unrelated recipes (a circular chip and a
 * hand-rolled squared dock key); `surface` is the only thing that differs between them now.
 */
export type IconButtonSize = 'md' | 'lg';

export interface IconButtonProps extends Omit<
    HeroButtonProps,
    'variant' | 'color' | 'isIconOnly' | 'size' | 'radius'
> {
    /** `danger` tints the hover red for destructive actions (the dock's "nueva partida"). */
    tone?: 'default' | 'danger';
    size?: IconButtonSize;
    /**
     * Where the control lives — the ONLY thing that changes its chrome:
     *  - `raised` (default): a standalone key on a page, so it carries its own surface (a chip
     *    with a hairline ring) because nothing around it does.
     *  - `bar`: a key INSIDE a `FLOATING_BAR`, where the bar is already the surface. It drops its
     *    own fill and ring. A ringed chip inside a ringed glass bar is a surface on a surface —
     *    which is exactly the duplication this prop removes.
     */
    surface?: 'raised' | 'bar';
}

const ICON_TONE = {
    default: 'text-gray-300 hover:bg-white/10 hover:text-white',
    danger: 'text-gray-300 hover:bg-rose-500/15 hover:text-rose-300',
} as const;

// `rounded-xl` on BOTH surfaces: the one control radius the labelled buttons already follow.
// The raised key used to be the app's only CIRCLE, so the header wore a circle on its left and
// rounded rectangles on its right — two shapes for one row of chrome.
const ICON_SURFACE = {
    raised: 'rounded-xl bg-white/5 ring-1 ring-inset ring-white/10 transition active:scale-90',
    bar: 'rounded-xl transition-all duration-200 hover:-translate-y-0.5 active:scale-90',
} as const;

// forwardRef, not FC: HeroUI's `<Tooltip>` clones its trigger and attaches a ref to it, so the
// dock's tooltip-labelled keys (`BarButton`) cannot reach the DOM node without this.
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
    { tone = 'default', surface = 'raised', className, size = 'lg', ...props },
    ref,
) {
    return (
        <HeroButton
            ref={ref}
            isIconOnly
            radius="lg"
            size={size}
            variant="light"
            disableRipple
            className={ClassnameHelper.join(
                FOCUS_RING_LIGHT,
                ICON_SURFACE[surface],
                ICON_TONE[tone],
                className,
                DISABLED,
            )}
            {...props}
        />
    );
});
