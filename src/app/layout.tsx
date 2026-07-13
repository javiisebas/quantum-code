import './globals.css';

import { ClassnameHelper } from '@/platform/util/classnames';
import type { Metadata, Viewport } from 'next';
import { Montserrat } from 'next/font/google';
import ModalComponent from '@/platform/ui/Modal';
import { RootProviders } from './providers';

const montserrat = Montserrat({
    subsets: ['latin'],
    variable: '--font-montserrat',
});

// Base URL for absolute metadata (OG/canonical). Prefers an explicit site URL, then
// Vercel's deployment URL, falling back to localhost in dev.
const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

export const metadata: Metadata = {
    metadataBase: new URL(siteUrl),
    title: {
        default: 'Quantum Arcade — Juegos de fiesta',
        template: '%s · Quantum Arcade',
    },
    description:
        'Juegos de fiesta para una pantalla y muchos móviles: Código Secreto, ¿Dónde está el espía?, Impostor, Hombres Lobo, El Camaleón, Chispas y Sintonía. Comparte un código y a jugar.',
    applicationName: 'Quantum Arcade',
    appleWebApp: {
        capable: true,
        title: 'Quantum Arcade',
        statusBarStyle: 'black-translucent',
    },
};

export const viewport: Viewport = {
    themeColor: '#111827',
    // Fixed dark theme, edge-to-edge on mobile (safe-area aware layouts).
    colorScheme: 'dark',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es" className={ClassnameHelper.join('dark', montserrat.variable)}>
            <body className="antialiased min-h-screen relative isolate overflow-x-hidden bg-gray-900">
                <svg
                    aria-hidden="true"
                    className="absolute inset-0 -z-10 size-full stroke-gray-800 [mask-image:radial-gradient(150%_150%_at_top_right,white,transparent)]"
                >
                    <defs>
                        <pattern
                            x="50%"
                            y={-1}
                            id="0787a7c5-978c-4f66-83c7-11c213f99cb7"
                            width={200}
                            height={200}
                            patternUnits="userSpaceOnUse"
                        >
                            <path d="M.5 200V.5H200" fill="none" />
                        </pattern>
                    </defs>
                    <rect
                        fill="url(#0787a7c5-978c-4f66-83c7-11c213f99cb7)"
                        width="100%"
                        height="100%"
                        strokeWidth={0}
                    />
                </svg>

                <div className="absolute inset-0 -z-10 overflow-hidden">
                    <svg
                        viewBox="0 0 1024 1024"
                        aria-hidden="true"
                        className="absolute left-1/2 top-1/2 -z-10 size-[300rem] -translate-x-1/2"
                    >
                        <circle
                            r={512}
                            cx={512}
                            cy={512}
                            fill="url(#layout-bg-gradient)"
                            fillOpacity="0.7"
                        />
                        <defs>
                            <radialGradient
                                r={1}
                                cx={0}
                                cy={0}
                                id="layout-bg-gradient"
                                gradientUnits="userSpaceOnUse"
                                gradientTransform="translate(512 512) rotate(90) scale(512)"
                            >
                                <stop stopColor="#C27AFF" />
                                <stop offset={1} stopColor="#C27AFF" stopOpacity={0} />
                            </radialGradient>
                        </defs>
                    </svg>
                </div>

                <RootProviders>
                    {children}
                    <ModalComponent />
                </RootProviders>
            </body>
        </html>
    );
}
