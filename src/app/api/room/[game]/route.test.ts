// CI injects PLACEHOLDER Upstash creds so the app can build a Redis client. These route
// handlers share the room-store singleton with the test, so strip any creds BEFORE the store
// resolves its (lazily cached) backend on first use — then both sides use the in-memory backend.
delete process.env.UPSTASH_REDIS_REST_URL;
delete process.env.UPSTASH_REDIS_REST_TOKEN;
delete process.env.UPSTASH_REDIS_KV_REST_API_URL;
delete process.env.UPSTASH_REDIS_KV_REST_API_TOKEN;

import { describe, expect, it, vi } from 'vitest';
import { buildSpyfall } from '@/games/spyfall/domain';
import { claimSeat, readRoom, reserveCode, writeRoomIfAbsent } from '@/platform/room/room-store';
import { HOST_TOKEN_HEADER, SEAT_TOKEN_HEADER } from '@/platform/room/tokens';
import { DELETE, GET, POST } from './route';
import { POST as CLAIM_SEAT } from './seat/route';

/**
 * The routes schedule their lifecycle webhooks with Next's `after()`, which THROWS when called
 * outside a request scope — and calling a handler directly, as these tests do, has no such scope.
 * Stubbing it to a no-op is what lets us exercise the paths that emit an event (a create, a
 * delete) at all; the webhook seam itself is not what is under test here.
 */
vi.mock('next/server', async (importOriginal) => ({
    ...(await importOriginal<typeof import('next/server')>()),
    after: () => {},
}));

/**
 * HTTP-boundary security tests for the generic room endpoint — the layer an attacker actually
 * reaches. The store's capability/projection primitives are unit-tested in
 * `platform/room/room-store.test.ts` and each game's `domain.test.ts`; here we pin the ROUTE's
 * own guarantees on top of them:
 *
 *   1. a per-seat-secret game's full deal is NEVER handed back by POST to a non-creator (the
 *      `created:false` "resume" leak — knowing the code is enough to defeat the seal otherwise);
 *   2. a per-seat GET returns only the caller seat's projected slice, and only with that seat's
 *      token;
 *   3. one code names one room across the arcade — resuming a code another game owns is refused;
 *   4. DELETE is host-authoritative — it was the lone unauthenticated mutation, and it both wipes
 *      the room and frees its code;
 *   5. a seat can only be claimed in a room that exists.
 *
 * Rooms are seeded through the STORE directly rather than via POST, so each test starts from an
 * exactly-known room without depending on the create path it isn't testing.
 */

const ctx = (game: string) => ({ params: Promise.resolve({ game }) });

const postJson = (game: string, body: unknown) =>
    POST(
        new Request(`http://test/api/room/${game}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        }),
        ctx(game),
    );

const getRoom = (game: string, code: number, seat?: number, token?: string) => {
    const url = new URL(`http://test/api/room/${game}`);
    url.searchParams.set('code', String(code));
    if (seat !== undefined) url.searchParams.set('seat', String(seat));
    const init = token ? { headers: { [SEAT_TOKEN_HEADER]: token } } : undefined;
    return GET(new Request(url.toString(), init), ctx(game));
};

const deleteRoom = (game: string, code: number, hostToken?: string) => {
    const url = `http://test/api/room/${game}?code=${code}`;
    const init = {
        method: 'DELETE',
        ...(hostToken ? { headers: { [HOST_TOKEN_HEADER]: hostToken } } : {}),
    };
    return DELETE(new Request(url, init), ctx(game));
};

const claimSeatRoute = (game: string, code: number) =>
    CLAIM_SEAT(
        new Request(`http://test/api/room/${game}/seat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code }),
        }),
        ctx(game),
    );

describe('POST /api/room/[game] — resume must not leak an existing per-seat deal', () => {
    it('withholds the stored deal from a non-creator resuming a per-seat-secret room', async () => {
        const code = 310001;
        const deal = buildSpyfall(4); // { location, roleBySeat[4], spySeat }
        await reserveCode(code, 'spyfall');
        const seeded = await writeRoomIfAbsent('spyfall', code, deal);
        expect(seeded.created).toBe(true);

        // An attacker who learned the code (e.g. via GET /api/join/<code>) posts a well-formed
        // spyfall payload of their own AT that code — a "resume". The room already exists, so this
        // caller did not create it: it must get back NO host token and, crucially, NO stored deal.
        const res = await postJson('spyfall', { code, payload: buildSpyfall(4) });
        expect(res.status).toBe(200);
        const json = (await res.json()) as { code: number; value: unknown; hostToken: unknown };
        expect(json.code).toBe(code);
        expect(json.hostToken).toBeNull();
        // The seal: the spy's seat and the whole role table stay server-side.
        expect(json.value).toBeNull();

        // And the genuine deal is untouched by the attacker's write (create-if-absent).
        expect(await readRoom('spyfall', code)).toEqual(deal);
    });

    it('still returns the value on resume for a shared/live game (fix is scoped to sealed games)', async () => {
        const code = 310002;
        await reserveCode(code, 'sintonia');
        await writeRoomIfAbsent('sintonia', code, { kind: 'live' });

        // Sintonía keeps no secret in its room payload (no `projectForSeat`), so resuming it must
        // behave exactly as before — the value comes back so the host reconverges on the room.
        const res = await postJson('sintonia', { code, payload: { kind: 'live' } });
        expect(res.status).toBe(200);
        const json = (await res.json()) as { value: unknown };
        expect(json.value).toEqual({ kind: 'live' });
    });

    it('refuses to resume a code another game already owns (one code = one room)', async () => {
        const code = 310003;
        await reserveCode(code, 'spyfall');
        // A different game presenting the same six digits would break the arcade-wide identity a
        // join code now carries; the route must 409 rather than hand the code to a second room.
        const res = await postJson('sintonia', { code, payload: { kind: 'live' } });
        expect(res.status).toBe(409);
    });
});

describe('GET /api/room/[game] — a per-seat read is sealed and seat-token gated', () => {
    it('returns only the caller seat’s projected slice, never the full deal', async () => {
        const code = 310010;
        const deal = buildSpyfall(5);
        await reserveCode(code, 'spyfall');
        await writeRoomIfAbsent('spyfall', code, deal);
        const claim = await claimSeat('spyfall', code); // seat 1 + its token

        const res = await getRoom('spyfall', code, claim.seat, claim.token);
        expect(res.status).toBe(200);
        const view = (await res.json()) as Record<string, unknown>;
        // Exactly this seat's view — spy or player — and NOTHING that names another seat.
        expect(['spy', 'player']).toContain(view.kind);
        expect('roleBySeat' in view).toBe(false);
        expect('spySeat' in view).toBe(false);
    });

    it('401s a seat token presented for a DIFFERENT seat', async () => {
        const code = 310011;
        await reserveCode(code, 'spyfall');
        await writeRoomIfAbsent('spyfall', code, buildSpyfall(5));
        const a = await claimSeat('spyfall', code); // seat 1
        const b = await claimSeat('spyfall', code); // seat 2

        // Seat 1's token cannot read seat 2's slice, even though it is a real (different) token.
        const res = await getRoom('spyfall', code, b.seat, a.token);
        expect(res.status).toBe(401);
    });

    it('401s a per-seat read with no seat token', async () => {
        const code = 310012;
        await reserveCode(code, 'spyfall');
        await writeRoomIfAbsent('spyfall', code, buildSpyfall(5));
        const res = await getRoom('spyfall', code, 1);
        expect(res.status).toBe(401);
    });

    it('400s a missing or out-of-range seat on a sealed read', async () => {
        const code = 310013;
        await reserveCode(code, 'spyfall');
        await writeRoomIfAbsent('spyfall', code, buildSpyfall(5));
        expect((await getRoom('spyfall', code)).status).toBe(400); // no seat
        expect((await getRoom('spyfall', code, 0, 'x')).status).toBe(400); // seat < 1
        expect((await getRoom('spyfall', code, 25, 'x')).status).toBe(400); // seat > ceiling
    });

    it('returns null for an unknown code (no room to project, no token needed)', async () => {
        const res = await getRoom('spyfall', 310099, 1, 'anything');
        expect(res.status).toBe(200);
        expect(await res.json()).toBeNull();
    });
});

describe('DELETE /api/room/[game] — destroying a room is host-authoritative', () => {
    it('401s a delete with no host token, and leaves the room intact', async () => {
        const code = 320001;
        await reserveCode(code, 'sintonia');
        await writeRoomIfAbsent('sintonia', code, { kind: 'live' });

        // Without this gate, anyone who knew the code could wipe an in-progress game and squat its
        // freed code for a different game — DELETE was the one unauthenticated mutation.
        expect((await deleteRoom('sintonia', code)).status).toBe(401);
        expect(await readRoom('sintonia', code)).not.toBeNull();
    });

    it('401s a delete with the WRONG host token', async () => {
        const code = 320002;
        await reserveCode(code, 'sintonia');
        await writeRoomIfAbsent('sintonia', code, { kind: 'live' });
        expect((await deleteRoom('sintonia', code, 'not-the-host-token')).status).toBe(401);
        expect(await readRoom('sintonia', code)).not.toBeNull();
    });

    it('deletes the room when the real host token is presented', async () => {
        const code = 320003;
        await reserveCode(code, 'sintonia');
        const { hostToken } = await writeRoomIfAbsent('sintonia', code, { kind: 'live' });
        expect(hostToken).not.toBeNull();

        const res = await deleteRoom('sintonia', code, hostToken!);
        expect(res.status).toBe(200);
        expect(await readRoom('sintonia', code)).toBeNull();
    });
});

describe('POST /api/room/[game]/seat — a seat can only be claimed in a room that exists', () => {
    it('404s a claim against a code no room holds (no arbitrary-code token writes)', async () => {
        // Unguarded, this minted+stored a token for ANY 6-digit code — a cost/space DoS against
        // rooms that never existed. A real phone always has a live code from its host.
        const res = await claimSeatRoute('spyfall', 329999);
        expect(res.status).toBe(404);
    });

    it('hands out a seat + token in a room that exists', async () => {
        const code = 320010;
        await reserveCode(code, 'spyfall');
        await writeRoomIfAbsent('spyfall', code, buildSpyfall(4));

        const res = await claimSeatRoute('spyfall', code);
        expect(res.status).toBe(200);
        const claim = (await res.json()) as { seat: number; token: string };
        expect(claim.seat).toBe(1);
        expect(typeof claim.token).toBe('string');
        expect(claim.token.length).toBeGreaterThan(0);
    });
});
