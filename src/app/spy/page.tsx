import { readRoles } from '@/app/api/roles/services/role-store';
import { parseCode, RoleEnum } from '@/domain';
import { SpyBoard } from './components/SpyBoard';
import { SpyJoinGame } from './components/SpyJoinGame';

interface SpyPageProps {
    searchParams: Promise<{ code?: string }>;
}

export default async function SpyPage({ searchParams }: SpyPageProps) {
    const params = await searchParams;
    const code = parseCode(params.code ?? null);

    // Reject junk codes up front — no Redis round-trip for invalid input.
    if (code === null) {
        return <SpyJoinGame />;
    }

    try {
        const roles = (await readRoles(code)) || [];

        if (!roles.length) return <SpyJoinGame />;

        return <SpyBoard roles={roles as RoleEnum[]} />;
    } catch {
        return <SpyJoinGame />;
    }
}
