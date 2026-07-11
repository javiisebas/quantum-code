import { heroui } from '@heroui/react';
import forms from '@tailwindcss/forms';
import type { Config } from 'tailwindcss';

const config: Config = {
    content: [
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
        './node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {
        extend: {
            colors: {
                background: 'var(--background)',
                foreground: 'var(--foreground)',
            },
        },
    },
    darkMode: 'class',
    plugins: [forms(), heroui()],

    // Role colours are applied through `getCardColor`, whose full class strings
    // are statically present in the source and picked up by Tailwind's scanner.
    // They are safelisted as a guard so a purge can never drop a board colour.
    safelist: [
        // blue
        'bg-sky-400',
        'text-sky-900',
        'shadow-sky-600/30',
        'border-sky-500/40',
        // red
        'bg-rose-400',
        'text-rose-900',
        'shadow-rose-600/30',
        'border-rose-500/40',
        // black (assassin)
        'bg-black',
        'text-white',
        'shadow-black/30',
        'border-gray-300/80',
        // neutral
        'bg-orange-200',
        'text-orange-800',
        'shadow-orange-600/30',
        'border-orange-400/40',
    ],
};
export default config;
