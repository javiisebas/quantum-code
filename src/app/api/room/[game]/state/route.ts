import { getServerGame } from '@/games/registry.server';
import { parseCode } from '@/platform/room';
import { readState, writeState } from '@/platform/room/live-store';
import { verifyHost } from '@/platform/room/room-store';
import { HOST_TOKEN_HEADER } from '@/platform/room/tokens';
import { NextResponse } from 'next/server';

/**
 * Live public state for phase-based games: `/api/room/[game]/state`.
 *
 *   GET ?code=            → the room's `{ rev, state }` document, or null when unpublished
 *   PUT { code, rev, state } → publish the room's public state (host token required)
 *
 * `state` is the game's own public snapshot; the server treats it as opaque JSON and only
 * guards its shape and size (the host token enforces that only the room's host writes it, so
 * per-game validation lives in the game's reducer rather than here). Phones poll GET — which
 * stays public — to render the game.
 */

type RouteContext = { params: Promise<{ game: string }> };

// Generous cap: a public snapshot (prompts, answers, scores) is small; this only stops abuse.
const MAX_STATE_BYTES = 256 * 1024;

const unknownGame = (game: string) =>
    NextResponse.json({ error: `Unknown game: ${game}` }, { status: 404 });

export async function GET(request: Request, { params }: RouteContext) {
    const { game } = await params;
    const mod = getServerGame(game);
    if (!mod) return unknownGame(game);

    const code = parseCode(new URL(request.url).searchParams.get('code'));
    if (code === null) {
        return NextResponse.json({ error: 'Invalid or missing code' }, { status: 400 });
    }

    try {
        const doc = await readState(mod.namespace, code);
        return NextResponse.json(doc ?? null);
    } catch (error: unknown) {
        console.error(`Failed to read ${game} live state:`, error);
        return NextResponse.json({ error: 'Failed to read state' }, { status: 500 });
    }
}

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

    const { code: rawCode, rev, state } = (body ?? {}) as {
        code?: unknown;
        rev?: unknown;
        state?: unknown;
    };
    const code = parseCode(typeof rawCode === 'number' ? String(rawCode) : (rawCode as string));

    if (
        code === null ||
        typeof rev !== 'number' ||
        !Number.isFinite(rev) ||
        typeof state !== 'object' ||
        state === null ||
        Array.isArray(state)
    ) {
        return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }
    if (JSON.stringify(state).length > MAX_STATE_BYTES) {
        return NextResponse.json({ error: 'State too large' }, { status: 413 });
    }

    // All request validation passed; now enforce that the caller is the room's host. Read the
    // token here (never throws) but run the check + write together in the try below.
    const token = request.headers.get(HOST_TOKEN_HEADER);

    try {
        if (!token || !(await verifyHost(mod.namespace, code, token))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        await writeState(mod.namespace, code, { rev, state });
        return NextResponse.json({ ok: true });
    } catch (error: unknown) {
        console.error(`Failed to write ${game} live state:`, error);
        return NextResponse.json({ error: 'Failed to write state' }, { status: 500 });
    }
}
