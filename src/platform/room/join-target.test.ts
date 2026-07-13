import { describe, expect, it } from 'vitest';
import { parseJoinCode } from './join-target';

/**
 * Everything a player can throw at the join flow funnels through here: a scanned QR, a pasted
 * link, or six digits typed by hand. It returns a CODE and never a game, because the game is the
 * server's to resolve now — that is precisely what removed the game picker from the join screen.
 *
 * The back-compat cases are not decoration: links shared before the QR moved to `/j/<code>` are
 * sitting in real chat threads, and they still have to work.
 */
describe('parseJoinCode', () => {
    it('reads the canonical short link the QR now encodes', () => {
        expect(parseJoinCode('https://quantum.app/j/611274')).toBe(611274);
        expect(parseJoinCode('http://localhost:3000/j/611274')).toBe(611274);
        // A trailing slash is still the same link.
        expect(parseJoinCode('https://quantum.app/j/611274/')).toBe(611274);
    });

    it('still reads LEGACY per-game links (the QR shape before the code became global)', () => {
        expect(parseJoinCode('https://quantum.app/join/bomba?code=611274')).toBe(611274);
        expect(parseJoinCode('https://quantum.app/join/codenames?code=100000')).toBe(100000);
        // The game segment is now ignored entirely — the code alone identifies the room, even if
        // that old link names a game the code no longer belongs to.
        expect(parseJoinCode('https://quantum.app/join/spyfall?code=611274')).toBe(611274);
    });

    it('reads a bare code, typed or pasted', () => {
        expect(parseJoinCode('611274')).toBe(611274);
        expect(parseJoinCode('  611274  ')).toBe(611274);
    });

    it('prefers an explicit code= over any other digits in the string', () => {
        // The origin contains a 6-digit run; the query is the one that must win.
        expect(parseJoinCode('http://192168.1.1/join/bomba?code=611274')).toBe(611274);
        expect(parseJoinCode('únete con code=611274 ahora')).toBe(611274);
    });

    it('rejects anything that is not a valid 6-digit code', () => {
        expect(parseJoinCode('')).toBeNull();
        expect(parseJoinCode('hola')).toBeNull();
        // Out of range: codes are 100000–999999, so a leading zero is not a code.
        expect(parseJoinCode('012345')).toBeNull();
        expect(parseJoinCode('99999')).toBeNull();
        expect(parseJoinCode('https://quantum.app/j/12345')).toBeNull();
        // A QR from something else entirely.
        expect(parseJoinCode('https://example.com/promo')).toBeNull();
    });

    it('takes the LAST 6-digit run when a loose string has several', () => {
        expect(parseJoinCode('sala 123456 ahora 611274')).toBe(611274);
    });
});
