import { heroui } from '@heroui/react';
import forms from '@tailwindcss/forms';
import type { Config } from 'tailwindcss';

const config: Config = {
    content: [
        // Scan the whole `src` tree: the arcade splits code across `platform/`,
        // `games/`, and `app/`, so limiting the scan to `app/` would drop classes
        // used by game modules and shared UI outside the route tree.
        './src/**/*.{js,ts,jsx,tsx,mdx}',
        './node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}',
    ],
    darkMode: 'class',

    theme: {
        extend: {
            screens: {
                /**
                 * A HEIGHT breakpoint, not a width one. Every screen in the arcade is built to fit
                 * in exactly one viewport with no page scroll, so the constraint that actually
                 * bites is vertical: a host lobby has to hold a QR, a 6-digit code, a roster and a
                 * CTA on an SE-sized phone (667px) without any of them being clipped. `short:`
                 * marks the rules that trade ceremony (padding, QR size, a stacked layout) for
                 * information (who has joined, and the button).
                 */
                short: { raw: '(max-height: 720px)' },
            },
        },
    },

    plugins: [forms(), heroui()],

    // Role colours are applied through `getCardColor`, whose full class strings
    // are statically present in the source and picked up by Tailwind's scanner.
    // They are safelisted as a guard so a purge can never drop a board colour.
    safelist: [
        // blue
        'bg-sky-500',
        'ring-sky-300/40',
        'shadow-sky-950/40',
        // red
        'bg-rose-500',
        'ring-rose-300/40',
        'shadow-rose-950/40',
        // neutral
        'bg-stone-300',
        'text-stone-700',
        'ring-stone-400/50',
        'shadow-stone-950/20',
        // black (assassin)
        'bg-gray-950',
        'text-rose-50',
        'ring-rose-500/60',
        'shadow-black/60',
        // shared
        'text-white',
        'ring-1',
        'ring-inset',
        'shadow-lg',
    ],
};
export default config;
