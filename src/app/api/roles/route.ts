import { RoleService } from '@/app/api/roles/services/role.service';
import { WORDS_LENGTH } from '@/consts';
import { NoTeamEnum } from '@/enum/no-team.enum';
import { RoleEnum } from '@/enum/role.enum';
import { TeamEnum } from '@/enum/team.enum';
import { NextResponse } from 'next/server';

const MIN_CODE = 100000;
const MAX_CODE = 999999;

const VALID_ROLES = new Set<string>([...Object.values(TeamEnum), ...Object.values(NoTeamEnum)]);

/**
 * Parse a game code from the query string. Codes are always 6-digit integers
 * (100000–999999); anything else is rejected. Returns null when invalid.
 */
const parseCode = (raw: string | null): number | null => {
    if (!raw || !/^\d+$/.test(raw)) {
        return null;
    }
    const code = Number(raw);
    if (!Number.isInteger(code) || code < MIN_CODE || code > MAX_CODE) {
        return null;
    }
    return code;
};

/**
 * A valid roles payload is an array of exactly WORDS_LENGTH entries, each a
 * known RoleEnum value. This blocks arbitrary/oversized junk from reaching Redis.
 */
const isValidRoles = (value: unknown): value is RoleEnum[] => {
    return (
        Array.isArray(value) &&
        value.length === WORDS_LENGTH &&
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
        const roles = await RoleService.readRoles(code);
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
        await RoleService.writeRoles(code, roles);
        return NextResponse.json({ message: 'Roles saved successfully' });
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
        const success = await RoleService.deleteRoles(code);
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
