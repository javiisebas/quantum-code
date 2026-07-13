import { getServerGame } from '@/games/registry.server';
import { parseCode } from '@/platform/room';
import { putPrivate, readPrivate } from '@/platform/room/live-store';
import { verifyHost, verifySeat } from '@/platform/room/room-store';
import { HOST_TOKEN_HEADER, SEAT_TOKEN_HEADER } from '@/platform/room/tokens';
import { NextResponse } from 'next/server';

/**
 * Per-seat PRIVATE channel for live games: `/api/room/[game]/private`.
 *
 *   PUT { code, round, seat, value } → host writes THIS seat's secret slice (host token)
 *   GET  ?code=&round=&seat=          → { value } — that seat reads ONLY its own (seat token)
 *
 * The mirror image of `input`: there each phone writes its own field and the host reads all;
 * here the HOST writes a secret slice per seat (e.g. Sintonía's target for the psychic) and
 * each phone reads ONLY its own field. Writes require the host token; a read requires that
 * seat's token, so a secret the game must show to exactly one player never rides the public
 * state document. `round` is any host-chosen bucket; `value` is opaque JSON, bounded in size.
 */

type RouteContext = { params: Promise<{ game: string }> };

const MAX_SEAT = 24; // matches the room-store seat ceiling.
const MAX_ROUND = 10_000; // generous upper bound so a junk round never keys a huge space.
const MAX_VALUE_BYTES = 16 * 1024; // a single secret slice — small.

const unknownGame = (game: string) =>
    NextResponse.json({ error: `Unknown game: ${game}` }, { status: 404 });

const parseIntField = (raw: unknown): number | null => {
    const n = typeof raw === 'number' ? raw : typeof raw === 'string' ? Number(raw) : NaN;
    return Number.isInteger(n) ? n : null;
};

export async function PUT(request: Request, { params }: RouteContext) {
    const { game } = await params;
    const mod = getServerGame(game);
    if (!mod) return unknownGame(game);

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { code: rawCode, round: rawRound, seat: rawSeat, value } = (body ?? {}) as {
        code?: unknown;
        round?: unknown;
        seat?: unknown;
        value?: unknown;
    };
    const code = parseCode(typeof rawCode === 'number' ? String(rawCode) : (rawCode as string));
    const round = parseIntField(rawRound);
    const seat = parseIntField(rawSeat);

    if (
        code === null ||
        round === null ||
        round < 0 ||
        round > MAX_ROUND ||
        seat === null ||
        seat < 1 ||
        seat > MAX_SEAT ||
        value === undefined ||
        JSON.stringify(value).length > MAX_VALUE_BYTES
    ) {
        return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Payload is well-formed; only the room's host may author a seat's private slice.
    const token = request.headers.get(HOST_TOKEN_HEADER);

    try {
        if (!token || !(await verifyHost(mod.namespace, code, token))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        await putPrivate(mod.namespace, code, round, seat, value);
        return NextResponse.json({ ok: true });
    } catch (error: unknown) {
        console.error(`Failed to write ${game} private state:`, error);
        return NextResponse.json({ error: 'Failed to write private state' }, { status: 500 });
    }
}

export async function GET(request: Request, { params }: RouteContext) {
    const { game } = await params;
    const mod = getServerGame(game);
    if (!mod) return unknownGame(game);

    const url = new URL(request.url);
    const code = parseCode(url.searchParams.get('code'));
    const round = parseIntField(url.searchParams.get('round'));
    const seat = parseIntField(url.searchParams.get('seat'));
    if (
        code === null ||
        round === null ||
        round < 0 ||
        round > MAX_ROUND ||
        seat === null ||
        seat < 1 ||
        seat > MAX_SEAT
    ) {
        return NextResponse.json({ error: 'Invalid or missing code/round/seat' }, { status: 400 });
    }

    // A seat's private slice is readable only by the device that owns that seat.
    const token = request.headers.get(SEAT_TOKEN_HEADER);

    try {
        // A genuine auth FAILURE (verifySeat → false) is a real 401; only a transient store
        // error (a throw below) falls back to the resilient `{ value: null }`, like input GET.
        if (!token || !(await verifySeat(mod.namespace, code, seat, token))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const value = await readPrivate(mod.namespace, code, round, seat);
        return NextResponse.json({ value });
    } catch (error: unknown) {
        console.error(`Failed to read ${game} private state:`, error);
        return NextResponse.json({ value: null });
    }
}
