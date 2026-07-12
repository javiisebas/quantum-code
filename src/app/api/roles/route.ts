import { deleteRoles, readRoles, writeRolesIfAbsent } from '@/app/api/roles/services/role-store';
import { BOARD_SIZE, NoTeamEnum, parseCode, RoleEnum, TeamEnum } from '@/domain';
import { NextResponse } from 'next/server';

const VALID_ROLES = new Set<string>([...Object.values(TeamEnum), ...Object.values(NoTeamEnum)]);

/**
 * A valid roles payload is an array of exactly BOARD_SIZE entries, each a known
 * RoleEnum value. This blocks arbitrary/oversized junk from reaching the store.
 */
const isValidRoles = (value: unknown): value is RoleEnum[] => {
    return (
        Array.isArray(value) &&
        value.length === BOARD_SIZE &&
        value.every((role) => typeof role === 'string' && VALID_ROLES.has(role))
    );
};

export async function GET(request: Request) {
    const url = new URL(request.url);
    const code = parseCode(url.searchParams.get('code'));

    if (code === null) {
        return NextResponse.json({ error: 'Invalid or missing code parameter' }, { status: 400 });
    }

    try {
        const roles = await readRoles(code);
        if (!roles) {
            return NextResponse.json(null);
        }
        return NextResponse.json(roles);
    } catch (error: unknown) {
        console.error('Failed to read roles:', error);
        return NextResponse.json({ error: 'Failed to read roles' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { code: rawCode, roles } = (body ?? {}) as { code?: unknown; roles?: unknown };
    const codeStr =
        typeof rawCode === 'number'
            ? String(rawCode)
            : typeof rawCode === 'string'
              ? rawCode
              : null;
    const code = parseCode(codeStr);

    if (code === null || !isValidRoles(roles)) {
        return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    try {
        // Atomic create-if-absent. Return the AUTHORITATIVE roles (whoever won the
        // race), so the client always converges on the same board for a code.
        const authoritativeRoles = await writeRolesIfAbsent(code, roles);
        return NextResponse.json(authoritativeRoles);
    } catch (error: unknown) {
        console.error('Failed to save roles:', error);
        return NextResponse.json({ error: 'Failed to save roles' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const url = new URL(request.url);
    const code = parseCode(url.searchParams.get('code'));

    if (code === null) {
        return NextResponse.json({ error: 'Invalid or missing code parameter' }, { status: 400 });
    }

    try {
        const success = await deleteRoles(code);
        if (!success) {
            return NextResponse.json(
                { error: 'Roles not found or could not be deleted' },
                { status: 404 },
            );
        }
        return NextResponse.json({ message: 'Roles deleted successfully' });
    } catch (error: unknown) {
        console.error('Failed to delete roles:', error);
        return NextResponse.json({ error: 'Failed to delete roles' }, { status: 500 });
    }
}
