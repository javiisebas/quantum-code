'use client';

import { ClassnameHelper } from '@/platform/util/classnames';
import { Button as HeroButton, ButtonProps as HeroButtonProps } from '@heroui/react';
import { FC } from 'react';

/**
 * The app's single button primitive. Every call site used to hand-roll its own
 * HeroUI `Button` (bordered / light / `color="secondary"` / raw `<button>`), which
 * produced ~16 visually different buttons. This collapses them to a small set of
 * intents so every action across the arcade looks and behaves identically.
 *
 *  - `primary`   → the canonical purple CTA (the one brand action colour).
 *  - `secondary` → outlined, for the lower-emphasis action beside a primary.
 *  - `ghost`     → text-only, for tertiary / "cancel" actions.
 *  - `danger`    → destructive confirm (reveal all, delete game…).
 *  - `accent`    → a per-game coloured solid CTA; pass the game's `accentClass`
 *                  (from `accentOf(...).solidButton`) so a rose game's lobby button
 *                  stays rose. Keeps `platform/` decoupled from game colour tokens.
 *
 * Pass only layout utilities (width, margins) through `className`; colour utilities
 * would collide with the variant recipe.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent';

const FOCUS =
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-500';

/**
 * One coherent disabled look for every variant. HeroUI's default is only
 * `opacity-disabled` (~0.5), which on a light accent (yellow/lime/amber) reads as a
 * washed-out solid rather than clearly "off" — a contrast/a11y problem on the dark bg
 * (e.g. the live lobby's "Empezar" CTA). Instead we drop the accent entirely for a
 * muted neutral surface and restore full opacity. Applied last in the class list; the
 * `data-[disabled=true]:` variants also outrank HeroUI's internal `opacity-disabled`
 * by specificity, so they win regardless of stylesheet order.
 */
const DISABLED =
    'data-[disabled=true]:cursor-not-allowed data-[disabled=true]:bg-white/5 data-[disabled=true]:text-white/40 data-[disabled=true]:shadow-none data-[disabled=true]:opacity-100';

const VARIANT: Record<ButtonVariant, string> = {
    primary: `bg-purple-600 font-semibold text-white shadow-lg shadow-purple-950/40 hover:bg-purple-500 ${FOCUS}`,
    accent: `font-semibold text-white shadow-lg shadow-black/20 ${FOCUS}`,
    danger: `bg-rose-600 font-semibold text-white shadow-lg shadow-rose-950/40 hover:bg-rose-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500`,
    secondary: `border-white/15 font-medium text-white hover:bg-white/5 ${FOCUS}`,
    ghost: `font-medium text-gray-300 hover:bg-white/5 hover:text-white ${FOCUS}`,
};

/** HeroUI's own `variant` per intent — controls the base fill/outline it renders. */
const HERO_VARIANT: Record<ButtonVariant, HeroButtonProps['variant']> = {
    primary: 'solid',
    accent: 'solid',
    danger: 'solid',
    secondary: 'bordered',
    ghost: 'light',
};

export interface ButtonProps extends Omit<HeroButtonProps, 'variant' | 'color'> {
    variant?: ButtonVariant;
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
        size={size}
        radius={radius}
        variant={HERO_VARIANT[variant]}
        disableRipple
        className={ClassnameHelper.join(
            // One control radius across the app: buttons match inputs/code cells (rounded-xl).
            'rounded-xl transition active:scale-[0.98]',
            VARIANT[variant],
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
 * Circular icon-only button (menu / stepper / dock actions). Unifies the four
 * divergent round-icon recipes that existed (different bg tint, ring and hover).
 */
export interface IconButtonProps extends Omit<HeroButtonProps, 'variant' | 'color' | 'isIconOnly'> {
    /** `danger` tints the hover red for destructive dock actions. */
    tone?: 'default' | 'danger';
}

const ICON_TONE = {
    default: 'text-gray-300 hover:bg-white/10 hover:text-white',
    danger: 'text-gray-300 hover:bg-rose-500/15 hover:text-rose-300',
} as const;

export const IconButton: FC<IconButtonProps> = ({
    tone = 'default',
    className,
    size = 'lg',
    ...props
}) => (
    <HeroButton
        isIconOnly
        radius="full"
        size={size}
        variant="light"
        disableRipple
        className={ClassnameHelper.join(
            'bg-white/5 ring-1 ring-inset ring-white/10 transition active:scale-90',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40',
            ICON_TONE[tone],
            className,
        )}
        {...props}
    />
);
