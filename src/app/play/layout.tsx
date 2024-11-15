import { PlayProviders } from './providers';

export default function PlayLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return <PlayProviders>{children}</PlayProviders>;
}
