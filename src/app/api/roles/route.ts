import { FileService } from '@/app/api/roles/services/file.service';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const url = new URL(request.url);
    const code = parseInt(url.searchParams.get('code') || '', 10);

    if (isNaN(code)) {
        return NextResponse.json({ error: 'Invalid or missing code parameter' }, { status: 400 });
    }

    try {
        const roles = await FileService.readRoles(code);
        if (!roles) {
            return NextResponse.json({ error: 'Roles not found' }, { status: 404 });
        }
        return NextResponse.json(roles);
    } catch (error: unknown) {
        if (error instanceof Error) {
            return NextResponse.json(
                { error: 'Failed to read roles', details: error.message },
                { status: 500 },
            );
        }
        return NextResponse.json(
            { error: 'Unknown error occurred while reading roles' },
            { status: 500 },
        );
    }
}

export async function POST(request: Request) {
    const body = await request.json();
    const { code, roles } = body;

    if (!code || !Array.isArray(roles)) {
        return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    try {
        await FileService.writeRoles(code, roles);
        return NextResponse.json({ message: 'Roles saved successfully' });
    } catch (error: unknown) {
        if (error instanceof Error) {
            return NextResponse.json(
                { error: 'Failed to save roles', details: error.message },
                { status: 500 },
            );
        }
        return NextResponse.json(
            { error: 'Unknown error occurred while saving roles' },
            { status: 500 },
        );
    }
}

export async function DELETE(request: Request) {
    const url = new URL(request.url);
    const code = parseInt(url.searchParams.get('code') || '', 10);

    if (isNaN(code)) {
        return NextResponse.json({ error: 'Invalid or missing code parameter' }, { status: 400 });
    }

    try {
        const success = await FileService.deleteRoles(code);
        if (!success) {
            return NextResponse.json(
                { error: 'Roles not found or could not be deleted' },
                { status: 404 },
            );
        }
        return NextResponse.json({ message: 'Roles deleted successfully' });
    } catch (error: unknown) {
        if (error instanceof Error) {
            return NextResponse.json(
                { error: 'Failed to delete roles', details: error.message },
                { status: 500 },
            );
        }
        return NextResponse.json(
            { error: 'Unknown error occurred while deleting roles' },
            { status: 500 },
        );
    }
}
