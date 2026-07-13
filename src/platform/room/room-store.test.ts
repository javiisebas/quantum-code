import { describe, expect, it } from 'vitest';

// CI injects PLACEHOLDER Upstash creds so the app can construct a Redis client at
// build time. For this unit test we want the in-memory backend, so strip any creds
// before the store resolves its (lazily cached) backend on first use.
delete process.env.UPSTASH_REDIS_REST_URL;
delete process.env.UPSTASH_REDIS_REST_TOKEN;
delete process.env.UPSTASH_REDIS_KV_REST_API_URL;
delete process.env.UPSTASH_REDIS_KV_REST_API_TOKEN;

import {
    allocateCode,
    claimSeat,
    deleteRoom,
    readRoom,
    releaseCode,
    reserveCode,
    resolveCode,
    verifyHost,
    verifySeat,
    writeRoomIfAbsent,
} from './room-store';

/**
 * Room store behaviour on the in-memory backend (no Redis creds in test env). Covers
 * the invariants every game relies on: create-if-absent is authoritative, namespaces
 * isolate games sharing a code, deletion clears the room, seat claims are unique, and the
 * host/seat capability tokens gate exactly what they should.
 */
describe('room-store (in-memory backend)', () => {
    it('reads null for an unknown room', async () => {
        expect(await readRoom('t-unknown', 100001)).toBeNull();
    });

    it('writeRoomIfAbsent creates then returns the authoritative payload + created flag + host token', async () => {
        const ns = 't-create';
        const first = await writeRoomIfAbsent(ns, 100002, { v: 1 });
        expect(first.value).toEqual({ v: 1 });
        expect(first.created).toBe(true);
        expect(typeof first.hostToken).toBe('string');
        // A second writer with a different payload must get the pre-existing one back,
        // created:false (so a retry never re-fires create-once side effects), and no token.
        const second = await writeRoomIfAbsent(ns, 100002, { v: 2 });
        expect(second.value).toEqual({ v: 1 });
        expect(second.created).toBe(false);
        expect(second.hostToken).toBeNull();
        expect(await readRoom<{ v: number }>(ns, 100002)).toEqual({ v: 1 });
    });

    it('isolates payloads by namespace for the same code', async () => {
        await writeRoomIfAbsent('t-a', 100003, { who: 'a' });
        await writeRoomIfAbsent('t-b', 100003, { who: 'b' });
        expect(await readRoom<{ who: string }>('t-a', 100003)).toEqual({ who: 'a' });
        expect(await readRoom<{ who: string }>('t-b', 100003)).toEqual({ who: 'b' });
    });

    it('deleteRoom removes the room', async () => {
        const ns = 't-del';
        await writeRoomIfAbsent(ns, 100004, { x: 1 });
        expect(await deleteRoom(ns, 100004)).toBe(true);
        expect(await readRoom(ns, 100004)).toBeNull();
    });

    it('claimSeat hands out unique, increasing 1-based seats, each with a token', async () => {
        const ns = 't-seat';
        const s1 = await claimSeat(ns, 100005);
        const s2 = await claimSeat(ns, 100005);
        const s3 = await claimSeat(ns, 100005);
        expect([s1.seat, s2.seat, s3.seat]).toEqual([1, 2, 3]);
        // Each seat gets a distinct, non-empty token.
        const tokens = [s1.token, s2.token, s3.token];
        expect(tokens.every((t) => typeof t === 'string' && t.length > 0)).toBe(true);
        expect(new Set(tokens).size).toBe(3);
        // A different room has its own counter.
        expect((await claimSeat(ns, 100006)).seat).toBe(1);
    });

    describe('capability tokens', () => {
        it('verifyHost accepts only the token minted at creation', async () => {
            const ns = 't-host';
            const { hostToken } = await writeRoomIfAbsent(ns, 100007, { v: 1 });
            expect(hostToken).not.toBeNull();
            expect(await verifyHost(ns, 100007, hostToken!)).toBe(true);
            expect(await verifyHost(ns, 100007, 'wrong')).toBe(false);
            expect(await verifyHost(ns, 100007, '')).toBe(false);
        });

        it('a losing create never overwrites or learns the real host token', async () => {
            const ns = 't-host-race';
            const winner = await writeRoomIfAbsent(ns, 100008, { v: 1 });
            // A late/duplicate create returns created:false and no token of its own.
            const late = await writeRoomIfAbsent(ns, 100008, { v: 9 });
            expect(late.created).toBe(false);
            expect(late.hostToken).toBeNull();
            expect(await verifyHost(ns, 100008, winner.hostToken!)).toBe(true);
        });

        it('verifySeat accepts only that seat’s own token', async () => {
            const ns = 't-seat-verify';
            const code = 100009;
            const a = await claimSeat(ns, code);
            const b = await claimSeat(ns, code);
            expect(await verifySeat(ns, code, a.seat, a.token)).toBe(true);
            expect(await verifySeat(ns, code, b.seat, b.token)).toBe(true);
            // A seat can't act as another seat, even with a real (different) token.
            expect(await verifySeat(ns, code, a.seat, b.token)).toBe(false);
            // Unclaimed seats and empty tokens are rejected.
            expect(await verifySeat(ns, code, 99, a.token)).toBe(false);
            expect(await verifySeat(ns, code, a.seat, '')).toBe(false);
        });

        it('unknown rooms verify nothing', async () => {
            expect(await verifyHost('t-none', 100010, 'x')).toBe(false);
            expect(await verifySeat('t-none', 100010, 1, 'x')).toBe(false);
        });
    });

    /**
     * The arcade-wide code index. Rooms are still stored per game (`bomba:611274`), but a CODE is
     * reserved across every game, so six digits name exactly one room. That guarantee is what lets
     * a player type a code and be routed to the right game — it is the reason the join flow has no
     * game picker, so it is worth pinning down hard.
     */
    describe('code index', () => {
        it('reserveCode takes a free code, and re-reserving it for the same game is idempotent', async () => {
            expect(await reserveCode(200001, 'bomba')).toBe('bomba');
            // A host resuming its own room must be able to re-reserve without being told no.
            expect(await reserveCode(200001, 'bomba')).toBe('bomba');
            expect(await resolveCode(200001)).toBe('bomba');
        });

        it('reserveCode reports the INCUMBENT when another game already holds the code', async () => {
            await reserveCode(200002, 'spyfall');
            // The caller must be able to tell "already mine" from "someone else's" — handing the
            // same code to two games would break the one-code-one-room guarantee outright.
            expect(await reserveCode(200002, 'werewolf')).toBe('spyfall');
            expect(await resolveCode(200002)).toBe('spyfall');
        });

        it('resolveCode returns null for a code no room holds', async () => {
            expect(await resolveCode(200003)).toBeNull();
        });

        it('releaseCode frees the code, but only for the game that owns it', async () => {
            await reserveCode(200004, 'chispas');
            // Another game cannot release someone else's reservation.
            await releaseCode(200004, 'bomba');
            expect(await resolveCode(200004)).toBe('chispas');
            // The owner can.
            await releaseCode(200004, 'chispas');
            expect(await resolveCode(200004)).toBeNull();
            // And once freed, the code is reusable by anyone.
            expect(await reserveCode(200004, 'bomba')).toBe('bomba');
        });

        it('allocateCode mints a reserved, in-range, unique code per call', async () => {
            const codes = await Promise.all([
                allocateCode('bomba'),
                allocateCode('bomba'),
                allocateCode('spyfall'),
            ]);
            expect(new Set(codes).size).toBe(3);
            for (const code of codes) {
                expect(code).toBeGreaterThanOrEqual(100000);
                expect(code).toBeLessThanOrEqual(999999);
            }
            expect(await resolveCode(codes[0])).toBe('bomba');
            expect(await resolveCode(codes[2])).toBe('spyfall');
        });
    });
});
