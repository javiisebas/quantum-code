import type { MetadataRoute } from 'next';

/**
 * PWA web app manifest for Quantum Code.
 *
 * User-facing strings (name/description) are in Spanish, matching the game's
 * Spanish-facing audience. Colors mirror the app's fixed dark theme
 * (Tailwind gray-900 background, purple accent).
 */
export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Quantum Code',
        short_name: 'Quantum Code',
        description:
            'Juego de espías tipo Codenames: descifra el código y guía a tu equipo a la victoria.',
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
