import { SpyBoardMenu } from './components/SpyBoardMenu';

export default function PlayLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="relative overflow-hidden min-h-screen flex items-center justify-center">
            {children}

            <div className="absolute left-1/2 bottom-10 -translate-x-1/2">
                <SpyBoardMenu />
            </div>
        </div>
    );
}
