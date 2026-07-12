import type { MetadataRoute } from 'next';

/**
 * PWA web app manifest for Quantum Arcade.
 *
 * User-facing strings (name/description) are in Spanish, matching the arcade's
 * Spanish-facing audience. Colors mirror the app's fixed dark theme
 * (Tailwind gray-900 background, purple accent).
 */
export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Quantum Arcade — Juegos de fiesta',
        short_name: 'Quantum Arcade',
        description:
            'Juegos de fiesta para una pantalla y muchos móviles. Comparte un código y a jugar.',
        start_url: '/',
        display: 'standalone',
        orientation: 'any',
        background_color: '#111827',
        theme_color: '#111827',
        lang: 'es',
        dir: 'ltr',
        categories: ['games', 'entertainment'],
        icons: [
            {
                src: '/icon.svg',
                sizes: 'any',
                type: 'image/svg+xml',
                purpose: 'any',
            },
            {
                src: '/icon.svg',
                sizes: 'any',
                type: 'image/svg+xml',
                purpose: 'maskable',
            },
        ],
    };
}
