import { getServerGame } from '@/games/registry.server';
import { emitRoomEvent } from '@/platform/events/webhooks';
import { parseCode } from '@/platform/room';
import { deleteRoom, readRoom, writeRoomIfAbsent } from '@/platform/room/room-store';
import { NextResponse } from 'next/server';

/**
 * Generic room endpoint shared by every game: `/api/room/[game]`.
 *
 *   GET    ?code=      → the room's payload, or null when the code is unknown
 *   POST   {code,payload} → atomically create-if-absent; returns the authoritative payload
 *   DELETE ?code=      → release the room
 *
 * The game id in the path selects the Redis namespace and the payload validator from
 * the server registry, so one route serves all games while each validates its own
 * payload shape.
 */

type RouteContext = { params: Promise<{ game: string }> };

const unknownGame = (game: string) =>
    NextResponse.json({ error: `Unknown game: ${game}` }, { status: 404 });

const invalidCode = () =>
    NextResponse.json({ error: 'Invalid or missing code parameter' }, { status: 400 });

export async function GET(request: Request, { params }: RouteContext) {
    const { game } = await params;
    const mod = getServerGame(game);
    if (!mod) return unknownGame(game);

    const code = parseCode(new URL(request.url).searchParams.get('code'));
    if (code === null) return invalidCode();

    try {
        const payload = await readRoom(mod.namespace, code);
        return NextResponse.json(payload ?? null);
    } catch (error: unknown) {
        console.error(`Failed to read ${game} room:`, error);
        return NextResponse.json({ error: 'Failed to read room' }, { status: 500 });
    }
}

export async function POST(request: Request, { params }: RouteContext) {
    const { game } = await params;
    const mod = getServerGame(game);
    if (!mod) return unknownGame(game);

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { code: rawCode, payload } = (body ?? {}) as { code?: unknown; payload?: unknown };
    const codeStr =
        typeof rawCode === 'number'
            ? String(rawCode)
            : typeof rawCode === 'string'
              ? rawCode
              : null;
    const code = parseCode(codeStr);

    if (code === null || !mod.validatePayload(payload)) {
        return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    try {
        // Atomic create-if-absent. Return the AUTHORITATIVE payload (whoever won the
        // race), so the host and every joined phone converge on the same room.
        const authoritative = await writeRoomIfAbsent(mod.namespace, code, payload);
        // Best-effort outbound webhook (no-op unless QUANTUM_WEBHOOK_URL is set).
        emitRoomEvent({ type: 'room.created', game, code });
        return NextResponse.json(authoritative);
    } catch (error: unknown) {
        console.error(`Failed to save ${game} room:`, error);
        return NextResponse.json({ error: 'Failed to save room' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: RouteContext) {
    const { game } = await params;
    const mod = getServerGame(game);
    if (!mod) return unknownGame(game);

    const code = parseCode(new URL(request.url).searchParams.get('code'));
    if (code === null) return invalidCode();

    try {
        const success = await deleteRoom(mod.namespace, code);
        if (!success) {
            return NextResponse.json(
                { error: 'Room not found or could not be deleted' },
                { status: 404 },
            );
        }
        emitRoomEvent({ type: 'game.ended', game, code });
        return NextResponse.json({ message: 'Room deleted successfully' });
    } catch (error: unknown) {
        console.error(`Failed to delete ${game} room:`, error);
        return NextResponse.json({ error: 'Failed to delete room' }, { status: 500 });
    }
}
