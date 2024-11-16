import { nextui } from '@nextui-org/react';
import forms from '@tailwindcss/forms';
import type { Config } from 'tailwindcss';

const config: Config = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
        './node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}',
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
    plugins: [forms(), nextui()],

    safelist: [
        'bg-black',
        'bg-cyan-400/80',
        'bg-gray-300',
        'bg-orange-300/80',
        'bg-rose-400/80',
        'border-black-500/40',
        'border-cyan-500/40',
        'border-orange-500/40',
        'border-rose-500/40',
        'shadow-black-600/30',
        'shadow-cyan-600/30',
        'shadow-lg',
        'shadow-orange-600/30',
        'shadow-rose-600/30',
        'text-gray-800',
        'text-white',
    ],
};
export default config;
