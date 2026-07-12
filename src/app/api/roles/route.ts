import { deleteBoard, readBoard, writeBoardIfAbsent } from '@/app/api/roles/services/board-store';
import { Board, BOARD_SIZE, NoTeamEnum, parseCode, RoleEnum, TeamEnum } from '@/domain';
import { NextResponse } from 'next/server';

const VALID_ROLES = new Set<string>([...Object.values(TeamEnum), ...Object.values(NoTeamEnum)]);
const MAX_WORD_LENGTH = 40;

/** Exactly BOARD_SIZE entries, each a known RoleEnum value. */
const isValidRoles = (value: unknown): value is RoleEnum[] =>
    Array.isArray(value) &&
    value.length === BOARD_SIZE &&
    value.every((role) => typeof role === 'string' && VALID_ROLES.has(role));

/** Exactly BOARD_SIZE non-empty, length-bounded strings. */
const isValidWords = (value: unknown): value is string[] =>
    Array.isArray(value) &&
    value.length === BOARD_SIZE &&
    value.every((w) => typeof w === 'string' && w.length > 0 && w.length <= MAX_WORD_LENGTH);

export async function GET(request: Request) {
    const url = new URL(request.url);
    const code = parseCode(url.searchParams.get('code'));

    if (code === null) {
        return NextResponse.json({ error: 'Invalid or missing code parameter' }, { status: 400 });
    }

    try {
        const board = await readBoard(code);
        return NextResponse.json(board ?? null);
    } catch (error: unknown) {
        console.error('Failed to read board:', error);
        return NextResponse.json({ error: 'Failed to read board' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const {
        code: rawCode,
        roles,
        words,
    } = (body ?? {}) as { code?: unknown; roles?: unknown; words?: unknown };
    const codeStr =
        typeof rawCode === 'number'
            ? String(rawCode)
            : typeof rawCode === 'string'
              ? rawCode
              : null;
    const code = parseCode(codeStr);

    if (code === null || !isValidRoles(roles) || !isValidWords(words)) {
        return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    try {
        // Atomic create-if-absent. Return the AUTHORITATIVE board (whoever won the
        // race), so the play device and the spies converge on the same board.
        const board: Board = { roles, words };
        const authoritative = await writeBoardIfAbsent(code, board);
        return NextResponse.json(authoritative);
    } catch (error: unknown) {
        console.error('Failed to save board:', error);
        return NextResponse.json({ error: 'Failed to save board' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const url = new URL(request.url);
    const code = parseCode(url.searchParams.get('code'));

    if (code === null) {
        return NextResponse.json({ error: 'Invalid or missing code parameter' }, { status: 400 });
    }

    try {
        const success = await deleteBoard(code);
        if (!success) {
            return NextResponse.json(
                { error: 'Board not found or could not be deleted' },
                { status: 404 },
            );
        }
        return NextResponse.json({ message: 'Board deleted successfully' });
    } catch (error: unknown) {
        console.error('Failed to delete board:', error);
        return NextResponse.json({ error: 'Failed to delete board' }, { status: 500 });
    }
}
