import { getManifest } from '@/games/registry';
import { parseCode } from '@/platform/room';

/**
 * Resolve where a raw string should send a player. The input is typically a scanned
 * QR payload, but the same logic accepts a pasted join link or a bare code.
 *
 * Two shapes are recognised:
 *  1. A canonical join URL — `…/join/<game>?code=NNNNNN`. Both the `<game>` path
 *     segment (must be a real manifest) and the `code` query (must pass `parseCode`)
 *     are validated; if either fails we fall through to the loose path below.
 *  2. Anything else containing a 6-digit code — a bare code, or a link we can't parse
 *     as a URL. We prefer an explicit `code=NNNNNN`, else the last 6-digit run, and
 *     pair it with `fallbackGame` (the game the player already chose / is looking at).
 *
 * Returns null when no valid game + code can be resolved. Framework-agnostic on
 * purpose (only the `URL` global) so it is safe to unit-test and import anywhere.
 */
export function parseJoinTarget(
    text: string,
    fallbackGame?: string,
): { game: string; code: number } | null {
    const raw = text.trim();

    // 1. A canonical join URL: /join/<game>?code=<code>.
    try {
        const url = new URL(raw);
        const segment = url.pathname.match(/^\/join\/([^/]+)\/?$/)?.[1];
        if (segment) {
            const code = parseCode(url.searchParams.get('code'));
            if (getManifest(segment) && code !== null) {
                return { game: segment, code };
            }
        }
    } catch {
        // Not a URL — fall through to loose code extraction.
    }

    // 2. Loose: pull a 6-digit code and pair it with the fallback game.
    const explicit = raw.match(/code=(\d{6})/i);
    const runs = raw.match(/\d{6}/g);
    const digits = explicit ? explicit[1] : runs ? runs[runs.length - 1] : null;
    const code = parseCode(digits);

    if (code !== null && fallbackGame && getManifest(fallbackGame)) {
        return { game: fallbackGame, code };
    }

    return null;
}
