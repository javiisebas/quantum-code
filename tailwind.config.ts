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
