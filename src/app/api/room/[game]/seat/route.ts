import { getServerGame } from '@/games/registry.server';
import { parseCode } from '@/platform/room';
import { claimSeat } from '@/platform/room/room-store';
import { NextResponse } from 'next/server';

/**
 * Claim the next seat in a room: `POST /api/room/[game]/seat  { code }`.
 *
 * Used by per-player-secret games (Spyfall, Undercover, …) where each phone must
 * receive a distinct assignment: the atomic counter hands every device a unique
 * 1-based seat number, which the game maps to a slot of the published payload.
 */

type RouteContext = { params: Promise<{ game: string }> };

export async function POST(request: Request, { params }: RouteContext) {
    const { game } = await params;
    const mod = getServerGame(game);
    if (!mod) {
        return NextResponse.json({ error: `Unknown game: ${game}` }, { status: 404 });
    }

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { code: rawCode } = (body ?? {}) as { code?: unknown };
    const codeStr =
        typeof rawCode === 'number'
            ? String(rawCode)
            : typeof rawCode === 'string'
              ? rawCode
              : null;
    const code = parseCode(codeStr);
    if (code === null) {
        return NextResponse.json({ error: 'Invalid or missing code' }, { status: 400 });
    }

    try {
        // Return the full claim ({ seat, token }): the token is how THIS device later proves
        // it owns the seat (submitting its input, reading its private slice). No token is
        // required to claim — claiming is exactly how a device first obtains one.
        const claim = await claimSeat(mod.namespace, code);
        return NextResponse.json(claim);
    } catch (error: unknown) {
        console.error(`Failed to claim seat in ${game} room:`, error);
        return NextResponse.json({ error: 'Failed to claim seat' }, { status: 500 });
    }
}
