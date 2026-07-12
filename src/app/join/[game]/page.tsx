import { getGameLoader } from '@/games/game-loaders';
import { getManifest } from '@/games/registry';
import { parseCode } from '@/platform/room';
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
    return { title: `Unirse a ${manifest.name}`, description: manifest.tagline };
}

/** Player (phone) screen for a game: `/join/<game>?code=<code>`. */
export default async function JoinGamePage({
    params,
    searchParams,
}: {
    params: Promise<{ game: string }>;
    searchParams: Promise<{ code?: string }>;
}) {
    const { game } = await params;
    const { code: rawCode } = await searchParams;

    const manifest = getManifest(game);
    const loader = getGameLoader(game);
    if (!manifest || !loader) {
        notFound();
    }

    const Player = loader.Player;
    // parseCode rejects junk up front; the Player renders its own join form on null.
    return <Player code={parseCode(rawCode)} />;
}
