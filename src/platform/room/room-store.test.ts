import { describe, expect, it } from 'vitest';

// CI injects PLACEHOLDER Upstash creds so the app can construct a Redis client at
// build time. For this unit test we want the in-memory backend, so strip any creds
// before the store resolves its (lazily cached) backend on first use.
delete process.env.UPSTASH_REDIS_REST_URL;
delete process.env.UPSTASH_REDIS_REST_TOKEN;
delete process.env.UPSTASH_REDIS_KV_REST_API_URL;
delete process.env.UPSTASH_REDIS_KV_REST_API_TOKEN;

import { claimSeat, deleteRoom, readRoom, writeRoomIfAbsent } from './room-store';

/**
 * Room store behaviour on the in-memory backend (no Redis creds in test env). Covers
 * the invariants every game relies on: create-if-absent is authoritative, namespaces
 * isolate games sharing a code, deletion clears the room, and seat claims are unique.
 */
describe('room-store (in-memory backend)', () => {
    it('reads null for an unknown room', async () => {
        expect(await readRoom('t-unknown', 100001)).toBeNull();
    });

    it('writeRoomIfAbsent creates then returns the authoritative payload + created flag', async () => {
        const ns = 't-create';
        const first = await writeRoomIfAbsent(ns, 100002, { v: 1 });
        expect(first).toEqual({ value: { v: 1 }, created: true });
        // A second writer with a different payload must get the pre-existing one back,
        // and created must be false (so a retry never re-fires create-once side effects).
        const second = await writeRoomIfAbsent(ns, 100002, { v: 2 });
        expect(second).toEqual({ value: { v: 1 }, created: false });
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

    it('claimSeat hands out unique, increasing 1-based seats', async () => {
        const ns = 't-seat';
        const s1 = await claimSeat(ns, 100005);
        const s2 = await claimSeat(ns, 100005);
        const s3 = await claimSeat(ns, 100005);
        expect([s1, s2, s3]).toEqual([1, 2, 3]);
        // A different room has its own counter.
        expect(await claimSeat(ns, 100006)).toBe(1);
    });
});
