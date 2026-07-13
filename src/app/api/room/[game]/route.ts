import { getServerGame } from '@/games/registry.server';
import { emitRoomEvent } from '@/platform/events/webhooks';
import { parseCode } from '@/platform/room';
import {
    allocateCode,
    deleteRoom,
    readRoom,
    releaseCode,
    reserveCode,
    verifySeat,
    writeRoomIfAbsent,
} from '@/platform/room/room-store';
import { SEAT_TOKEN_HEADER } from '@/platform/room/tokens';
import { NextResponse, after } from 'next/server';

/**
 * Generic room endpoint shared by every game: `/api/room/[game]`.
 *
 *   GET    ?code= [&seat=] → the room's payload, or null when unknown. For per-player-secret
 *                            games (a `projectForSeat`) it returns ONLY the caller's seat slice,
 *                            gated by that seat's token, so no phone sees another seat's secret.
 *   POST   {code,payload}  → atomically create-if-absent; returns { value, hostToken }
 *   DELETE ?code=          → release the room
 *
 * The game id in the path selects the Redis namespace, payload validator and seat projector
 * from the server registry, so one route serves all games while each seals its own secrets.
 */

type RouteContext = { params: Promise<{ game: string }> };

const MAX_SEAT = 24; // matches the room-store seat ceiling.

const unknownGame = (game: string) =>
    NextResponse.json({ error: `Unknown game: ${game}` }, { status: 404 });

const invalidCode = () =>
    NextResponse.json({ error: 'Invalid or missing code parameter' }, { status: 400 });

const parseIntField = (raw: unknown): number | null => {
    const n = typeof raw === 'number' ? raw : typeof raw === 'string' ? Number(raw) : NaN;
    return Number.isInteger(n) ? n : null;
};

export async function GET(request: Request, { params }: RouteContext) {
    const { game } = await params;
    const mod = getServerGame(game);
    if (!mod) return unknownGame(game);

    const url = new URL(request.url);
    const code = parseCode(url.searchParams.get('code'));
    if (code === null) return invalidCode();

    try {
        const payload = await readRoom(mod.namespace, code);
        if (payload === null) return NextResponse.json(null);

        // Per-player-secret games: hand back ONLY this seat's projected slice, and only to the
        // device that owns the seat. Shared games (Codenames) and live games (no projector)
        // return the full payload — they carry no per-seat secret to leak.
        if (mod.projectForSeat) {
            const seat = parseIntField(url.searchParams.get('seat'));
            if (seat === null || seat < 1 || seat > MAX_SEAT) {
                return NextResponse.json({ error: 'Invalid or missing seat' }, { status: 400 });
            }
            const token = request.headers.get(SEAT_TOKEN_HEADER);
            if (!token || !(await verifySeat(mod.namespace, code, seat, token))) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
            return NextResponse.json(mod.projectForSeat(payload, seat));
        }

        return NextResponse.json(payload);
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

    if (!mod.validatePayload(payload)) {
        return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Two shapes, one endpoint:
    //   { payload }        → OPEN a room: the server mints a code that is free across the whole
    //                        arcade (only it can see every game's reservations).
    //   { code, payload }  → RESUME a room: the host reloaded and re-presents its persisted
    //                        code, so the room (and its code reservation) are re-ensured.
    const resuming = rawCode !== undefined && rawCode !== null;
    const code = resuming
        ? parseCode(typeof rawCode === 'number' ? String(rawCode) : String(rawCode))
        : null;

    if (resuming && code === null) {
        return invalidCode();
    }

    try {
        let roomCode: number;

        if (code === null) {
            roomCode = await allocateCode(game);
        } else {
            // Re-reserving our own code is idempotent; a code held by ANOTHER game means these
            // six digits already name a different room, and handing it out twice would break the
            // one-code-one-room guarantee the whole join flow now rests on.
            const owner = await reserveCode(code, game);
            if (owner !== game) {
                return NextResponse.json({ error: 'Code already in use' }, { status: 409 });
            }
            roomCode = code;
        }

        // Atomic create-if-absent. Return the AUTHORITATIVE payload (whoever won the
        // race), so the host and every joined phone converge on the same room, plus the
        // minted host token (null unless THIS call created the room — see RoomCreation).
        const { value, created, hostToken } = await writeRoomIfAbsent(
            mod.namespace,
            roomCode,
            payload,
        );
        // Fire the webhook exactly once, only when this call actually created the room,
        // and as post-response work so a slow/failing hook never blocks the response
        // (and isn't dropped when the serverless function freezes on return).
        if (created) {
            after(() => emitRoomEvent({ type: 'room.created', game, code: roomCode }));
        }
        return NextResponse.json({ code: roomCode, value, hostToken });
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
        // Hand the code back to the pool whether or not a payload was there to remove: the
        // reservation outlives the room otherwise, and a released room's code should be
        // reusable immediately rather than squatting the index until its TTL lapses.
        await releaseCode(code, game);
        if (!success) {
            return NextResponse.json(
                { error: 'Room not found or could not be deleted' },
                { status: 404 },
            );
        }
        after(() => emitRoomEvent({ type: 'game.ended', game, code }));
        return NextResponse.json({ message: 'Room deleted successfully' });
    } catch (error: unknown) {
        console.error(`Failed to delete ${game} room:`, error);
        return NextResponse.json({ error: 'Failed to delete room' }, { status: 500 });
    }
}
