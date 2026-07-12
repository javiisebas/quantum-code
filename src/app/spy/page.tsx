import { readBoard } from '@/app/api/roles/services/board-store';
import { parseCode } from '@/domain';
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
        const board = await readBoard(code);

        if (!board?.roles.length) return <SpyJoinGame />;

        return <SpyBoard roles={board.roles} words={board.words} />;
    } catch {
        return <SpyJoinGame />;
    }
}
