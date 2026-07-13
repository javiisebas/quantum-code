import { getManifest } from '@/games/registry';
import { parseCode } from '@/platform/room';
import { resolveCode } from '@/platform/room/room-store';
import { NextResponse } from 'next/server';

/**
 * `GET /api/join/<code>` — resolve six digits to the game they belong to.
 *
 * This is the endpoint that removes the game picker from the join flow. Rooms live in
 * per-game namespaces (`bomba:611274`), but codes are reserved arcade-wide, so a code names
 * exactly one room and the platform — not the player — can say which game it is.
 *
 *   200 { game, name, emoji }  → route the player straight into that game
 *   404 { error: 'unknown' }   → no live room; the join screen says so instead of dumping the
 *                                player into an empty form for a game they never chose
 */
type RouteContext = { params: Promise<{ code: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
    const { code: raw } = await params;
    const code = parseCode(raw);

    if (code === null) {
        return NextResponse.json({ error: 'invalid' }, { status: 400 });
    }

    try {
        const game = await resolveCode(code);
        const manifest = game ? getManifest(game) : null;

        // A code pointing at a game we no longer ship is as good as unknown.
        if (!manifest) {
            return NextResponse.json({ error: 'unknown' }, { status: 404 });
        }

        return NextResponse.json({
            game: manifest.id,
            name: manifest.name,
            emoji: manifest.emoji,
        });
    } catch (error: unknown) {
        console.error(`Failed to resolve join code ${code}:`, error);
        return NextResponse.json({ error: 'failed' }, { status: 500 });
    }
}
