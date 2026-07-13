import { getServerGame } from '@/games/registry.server';
import { parseCode } from '@/platform/room';
import { countActive, heartbeat } from '@/platform/room/presence-store';
import { NextResponse } from 'next/server';

/**
 * Room presence: the "life" signal for the host lobby.
 *
 *   POST { code, playerId } → record a heartbeat for this phone
 *   GET  ?code=             → { count } phones active within the window
 */

type RouteContext = { params: Promise<{ game: string }> };

export async function POST(request: Request, { params }: RouteContext) {
    const { game } = await params;
    const mod = getServerGame(game);
    if (!mod) return NextResponse.json({ error: `Unknown game: ${game}` }, { status: 404 });

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { code: rawCode, playerId } = (body ?? {}) as { code?: unknown; playerId?: unknown };
    const code = parseCode(typeof rawCode === 'number' ? String(rawCode) : (rawCode as string));
    if (
        code === null ||
        typeof playerId !== 'string' ||
        playerId.length === 0 ||
        playerId.length > 64
    ) {
        return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    try {
        await heartbeat(mod.namespace, code, playerId);
        return NextResponse.json({ ok: true });
    } catch (error: unknown) {
        console.error(`Presence heartbeat failed for ${game}:`, error);
        // Presence is non-critical — never surface a 500 that would spam the client.
        return NextResponse.json({ ok: false });
    }
}

export async function GET(request: Request, { params }: RouteContext) {
    const { game } = await params;
    const mod = getServerGame(game);
    if (!mod) return NextResponse.json({ error: `Unknown game: ${game}` }, { status: 404 });

    const code = parseCode(new URL(request.url).searchParams.get('code'));
    if (code === null) {
        return NextResponse.json({ error: 'Invalid or missing code' }, { status: 400 });
    }

    try {
        const count = await countActive(mod.namespace, code);
        return NextResponse.json({ count });
    } catch (error: unknown) {
        console.error(`Presence count failed for ${game}:`, error);
        return NextResponse.json({ count: 0 });
    }
}
