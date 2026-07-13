import { getGameLoader } from '@/games/game-loaders';
import { getManifest } from '@/games/registry';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

export async function generateMetadata({
    params,
}: {
    params: Promise<{ game: string }>;
}): Promise<Metadata> {
    const { game } = await params;
    const manifest = getManifest(game);
    if (!manifest) return { title: 'Juego no encontrado' };
    return { title: manifest.name, description: manifest.tagline };
}

/** Host (shared board) screen for a game: `/host/<game>`. */
export default async function HostPage({ params }: { params: Promise<{ game: string }> }) {
    const { game } = await params;
    const manifest = getManifest(game);
    const loader = getGameLoader(game);
    if (!manifest || !loader) {
        notFound();
    }

    const Host = loader.Host;
    return <Host />;
}
