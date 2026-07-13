import { getServerGame } from '@/games/registry.server';
import { parseCode } from '@/platform/room';
import { putInput, readInputs } from '@/platform/room/live-store';
import { verifyHost, verifySeat } from '@/platform/room/room-store';
import { HOST_TOKEN_HEADER, SEAT_TOKEN_HEADER } from '@/platform/room/tokens';
import { NextResponse } from 'next/server';

/**
 * Per-seat player input for live games: `/api/room/[game]/input`.
 *
 *   POST { code, round, seat, value } → write THIS seat's input for a round (that seat's token)
 *   GET  ?code=&round=                → { inputs: { [seat]: value } } (host token; folds these in)
 *
 * Each phone writes only its own seat's field (see live-store), so concurrent submissions
 * never race, and each seat's token is what enforces a phone can only write ITS own field
 * while only the host may read them all. `round` is any host-chosen bucket (0 = name roster,
 * 1..n = game rounds). `value` is opaque JSON, only bounded in size here; the host's reducer
 * interprets it.
 */

type RouteContext = { params: Promise<{ game: string }> };

const MAX_SEAT = 24; // matches the room-store seat ceiling.
const MAX_ROUND = 10_000; // generous upper bound so a junk round never keys a huge space.
const MAX_VALUE_BYTES = 16 * 1024; // a single answer/vote/name — small.

const unknownGame = (game: string) =>
    NextResponse.json({ error: `Unknown game: ${game}` }, { status: 404 });

const parseIntField = (raw: unknown): number | null => {
    const n = typeof raw === 'number' ? raw : typeof raw === 'string' ? Number(raw) : NaN;
    return Number.isInteger(n) ? n : null;
};

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

    const {
        code: rawCode,
        round: rawRound,
        seat: rawSeat,
        value,
    } = (body ?? {}) as {
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

    // Payload is well-formed; now enforce that the caller owns this seat before storing.
    const token = request.headers.get(SEAT_TOKEN_HEADER);

    try {
        if (!token || !(await verifySeat(mod.namespace, code, seat, token))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        await putInput(mod.namespace, code, round, seat, value);
        return NextResponse.json({ ok: true });
    } catch (error: unknown) {
        console.error(`Failed to write ${game} input:`, error);
        return NextResponse.json({ error: 'Failed to write input' }, { status: 500 });
    }
}

export async function GET(request: Request, { params }: RouteContext) {
    const { game } = await params;
    const mod = getServerGame(game);
    if (!mod) return unknownGame(game);

    const url = new URL(request.url);
    const code = parseCode(url.searchParams.get('code'));
    const round = parseIntField(url.searchParams.get('round'));
    if (code === null || round === null || round < 0 || round > MAX_ROUND) {
        return NextResponse.json({ error: 'Invalid or missing code/round' }, { status: 400 });
    }

    // Reading every seat's input is a host-only capability; require the host token.
    const token = request.headers.get(HOST_TOKEN_HEADER);

    try {
        // A genuine auth FAILURE (verifyHost → false) is a real 401 — never a silent empty read.
        // Only a transient store error (a throw below) falls back to the resilient `{inputs:{}}`.
        if (!token || !(await verifyHost(mod.namespace, code, token))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const inputs = await readInputs(mod.namespace, code, round);
        return NextResponse.json({ inputs });
    } catch (error: unknown) {
        console.error(`Failed to read ${game} inputs:`, error);
        return NextResponse.json({ inputs: {} });
    }
}
