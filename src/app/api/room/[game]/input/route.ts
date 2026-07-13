import { getServerGame } from '@/games/registry.server';
import { parseCode } from '@/platform/room';
import { putInput, readInputs } from '@/platform/room/live-store';
import { NextResponse } from 'next/server';

/**
 * Per-seat player input for live games: `/api/room/[game]/input`.
 *
 *   POST { code, round, seat, value } → write THIS seat's input for a round
 *   GET  ?code=&round=                → { inputs: { [seat]: value } } (host folds these in)
 *
 * Each phone writes only its own seat's field (see live-store), so concurrent submissions
 * never race. `round` is any host-chosen bucket (0 = name roster, 1..n = game rounds).
 * `value` is opaque JSON, only bounded in size here; the host's reducer interprets it.
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

    try {
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

    try {
        const inputs = await readInputs(mod.namespace, code, round);
        return NextResponse.json({ inputs });
    } catch (error: unknown) {
        console.error(`Failed to read ${game} inputs:`, error);
        return NextResponse.json({ inputs: {} });
    }
}
