import './globals.css';

import { ClassnameHelper } from '@/helpers/clean-classname.helper';
import type { Metadata } from 'next';
import { Montserrat } from 'next/font/google';
import ModalComponent from './components/ui/Modal';
import { RootProviders } from './providers';

const montserrat = Montserrat({
    subsets: ['latin'],
    variable: '--font-montserrat',
});

export const metadata: Metadata = {
    title: 'Quantum Code',
    description: 'Quantum Code',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className={ClassnameHelper.join('dark', montserrat.variable)}>
            <body className="antialiased min-h-screen relative isolate overflow-hidden bg-gray-900">
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
                            fill="url(#759c1415-0410-454c-8f7c-9a820de03641)"
                            fillOpacity="0.7"
                        />
                        <defs>
                            <radialGradient
                                r={1}
                                cx={0}
                                cy={0}
                                id="759c1415-0410-454c-8f7c-9a820de03641"
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
