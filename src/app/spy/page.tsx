import { RoleEnum } from '@/enum/role.enum';
import { RoleService } from '../api/roles/services/role.service';
import { SpyBoard } from './components/SpyBoard';
import { SpyJoinGame } from './components/SpyJoinGame';

interface SpyPageProps {
    searchParams: Promise<{ code?: string }>;
}

export default async function SpyPage({ searchParams }: SpyPageProps) {
    const params = await searchParams;
    const code = parseInt(params.code || '', 10);

    try {
        const roles = (await RoleService.readRoles(code)) || [];

        if (!roles.length) return <SpyJoinGame />;

        return <SpyBoard roles={roles as RoleEnum[]} />;
    } catch {
        return <SpyJoinGame />;
    }
}
