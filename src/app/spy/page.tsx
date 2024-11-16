import { RoleEnum } from '@/enum/role.enum';
import { FileService } from '../api/roles/services/file.service';
import { SpyBoard } from './components/SpyBoard';
import { SpyJoinGame } from './components/SpyJoinGame';

interface SpyPageProps {
    searchParams: Promise<{ code?: string }>;
}

export default async function SpyPage({ searchParams }: SpyPageProps) {
    const params = await searchParams;
    const code = parseInt(params.code || '', 10);

    try {
        const roles = (await FileService.readRoles(code)) || [];

        if (!roles.length) return <SpyJoinGame />;

        return <SpyBoard roles={roles as RoleEnum[]} />;
    } catch {
        return <SpyJoinGame />;
    }
}
