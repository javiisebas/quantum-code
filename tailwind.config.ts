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
        'bg-sky-400',
        'bg-gray-300',
        'bg-orange-200',
        'bg-rose-400',
        'border-black-500/40',
        'border-sky-500/40',
        'border-orange-400/40',
        'border-rose-500/40',
        'shadow-black-600/30',
        'shadow-sky-600/30',
        'shadow-lg',
        'shadow-orange-600/30',
        'shadow-rose-600/30',
        'text-gray-800',
        'text-white',
        'border-gray-300/80',
        'text-orange-800',
        'text-sky-900',
        'text-rose-900',
    ],
};
export default config;
