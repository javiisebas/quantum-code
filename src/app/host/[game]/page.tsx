import { getGameLoader } from '@/games/game-loaders';
import { getManifest } from '@/games/registry';
import { notFound } from 'next/navigation';

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
