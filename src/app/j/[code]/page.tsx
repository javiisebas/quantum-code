import { getManifest } from '@/games/registry';
import { parseCode } from '@/platform/room';
import { resolveCode } from '@/platform/room/room-store';
import { JoinScreen } from '@/platform/ui/JoinScreen';
import { redirect } from 'next/navigation';

/**
 * `/j/<code>` — the short join link the host's QR encodes, and the ONLY thing the QR carries.
 *
 * The game is resolved here, on the server, from the arcade-wide code index: a scanned phone
 * lands directly in the right game without anyone ever choosing it from a list. Keeping the
 * game out of the QR also keeps the QR short, so it stays coarse and scans fast from across a
 * room — the old `/join/<game>?code=…` payload was ~40% longer for no benefit.
 *
 * An unknown or dead code does NOT 404 into a wall: it re-renders the join screen with the code
 * pre-filled and an explanation, so the player can fix a typo without navigating anywhere.
 */
export const dynamic = 'force-dynamic';

export default async function ShortJoinPage({ params }: { params: Promise<{ code: string }> }) {
    const { code: raw } = await params;
    const code = parseCode(raw);

    if (code !== null) {
        const game = await resolveCode(code);
        if (game && getManifest(game)) {
            redirect(`/join/${game}?code=${code}`);
        }
    }

    return <JoinScreen initialCode={raw.replace(/\D/g, '').slice(0, 6)} initialError="unknown" />;
}
