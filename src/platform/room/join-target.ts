import { parseCode } from '@/platform/room';

/**
 * Pull a join code out of whatever a player throws at us — a scanned QR payload, a pasted
 * join link, or six digits typed by hand.
 *
 * It returns only the CODE, never a game: the code is now an arcade-wide identity that the
 * server resolves to its game (`GET /api/join/<code>`). That is what removed the game picker
 * from the join flow — nothing on the client has to know, or guess, which game a code belongs
 * to. It also means an OLD QR still works: `/join/<game>?code=NNNNNN` links shared before this
 * change carry the same code, and the code is all we read.
 *
 * Recognised shapes, in order of trust:
 *   1. `…/j/NNNNNN`                 — the canonical short join link the QR now encodes.
 *   2. `…?code=NNNNNN`              — any link carrying an explicit code query (incl. legacy
 *                                     `/join/<game>?code=…`).
 *   3. anything else with 6 digits  — a bare typed/pasted code, or a link we can't parse.
 *
 * The `code=` query is preferred over a loose digit scan so a URL whose origin happens to
 * contain a 6-digit run can't poison the result. Framework-agnostic (only the `URL` global) so
 * it is safe to unit-test and import anywhere.
 */
export function parseJoinCode(text: string): number | null {
    const raw = text.trim();

    // 1. The canonical short link: /j/<code>.
    try {
        const url = new URL(raw);
        const fromPath = parseCode(url.pathname.match(/^\/j\/([^/]+)\/?$/)?.[1]);
        if (fromPath !== null) {
            return fromPath;
        }

        // 2. Any link with an explicit ?code= (covers the legacy /join/<game>?code=… QRs).
        const fromQuery = parseCode(url.searchParams.get('code'));
        if (fromQuery !== null) {
            return fromQuery;
        }
    } catch {
        // Not a URL — fall through to the loose scan.
    }

    // 3. Loose: an explicit `code=` in a non-URL string, else the last 6-digit run.
    const explicit = raw.match(/code=(\d{6})/i);
    if (explicit) {
        return parseCode(explicit[1]);
    }

    const runs = raw.match(/\d{6}/g);
    return parseCode(runs ? runs[runs.length - 1] : null);
}
