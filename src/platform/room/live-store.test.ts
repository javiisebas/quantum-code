import { describe, expect, it } from 'vitest';

// CI injects PLACEHOLDER Upstash creds so the app can construct a Redis client at build
// time. For this unit test we want the in-memory backend, so strip any creds before the
// store resolves its (lazily cached) backend on first use.
delete process.env.UPSTASH_REDIS_REST_URL;
delete process.env.UPSTASH_REDIS_REST_TOKEN;
delete process.env.UPSTASH_REDIS_KV_REST_API_URL;
delete process.env.UPSTASH_REDIS_KV_REST_API_TOKEN;

import {
    clearState,
    putInput,
    putPrivate,
    readInputs,
    readPrivate,
    readState,
    writeState,
} from './live-store';

/**
 * Live-store behaviour on the in-memory backend. Covers the invariants live games rely on:
 * state is host-authoritative last-write-wins, per-seat inputs never clobber each other,
 * rounds and namespaces isolate, and teardown clears state.
 */
describe('live-store (in-memory backend)', () => {
    it('reads null state for an unpublished room', async () => {
        expect(await readState('lt-unknown', 100101)).toBeNull();
    });

    it('writeState publishes and overwrites (last write wins)', async () => {
        const ns = 'lt-state';
        await writeState(ns, 100102, { rev: 1, state: { phase: 'answer' } });
        expect(await readState<{ phase: string }>(ns, 100102)).toEqual({
            rev: 1,
            state: { phase: 'answer' },
        });
        await writeState(ns, 100102, { rev: 2, state: { phase: 'vote' } });
        expect(await readState<{ phase: string }>(ns, 100102)).toEqual({
            rev: 2,
            state: { phase: 'vote' },
        });
    });

    it('clearState drops the published state', async () => {
        const ns = 'lt-clear';
        await writeState(ns, 100103, { rev: 1, state: { x: 1 } });
        await clearState(ns, 100103);
        expect(await readState(ns, 100103)).toBeNull();
    });

    it('per-seat inputs coexist without clobbering each other', async () => {
        const ns = 'lt-input';
        const code = 100104;
        await putInput(ns, code, 1, 2, { answer: 'dos' });
        await putInput(ns, code, 1, 1, { answer: 'uno' });
        await putInput(ns, code, 1, 3, { answer: 'tres' });
        const inputs = await readInputs<{ answer: string }>(ns, code, 1);
        expect(inputs).toEqual({
            1: { answer: 'uno' },
            2: { answer: 'dos' },
            3: { answer: 'tres' },
        });
    });

    it('a seat can overwrite its own input; other seats are untouched', async () => {
        const ns = 'lt-overwrite';
        const code = 100105;
        await putInput(ns, code, 1, 1, { answer: 'first' });
        await putInput(ns, code, 1, 2, { answer: 'keep' });
        await putInput(ns, code, 1, 1, { answer: 'second' });
        expect(await readInputs<{ answer: string }>(ns, code, 1)).toEqual({
            1: { answer: 'second' },
            2: { answer: 'keep' },
        });
    });

    it('isolates inputs by round and by namespace', async () => {
        const code = 100106;
        await putInput('lt-x', code, 1, 1, 'x-r1');
        await putInput('lt-x', code, 2, 1, 'x-r2');
        await putInput('lt-y', code, 1, 1, 'y-r1');
        expect(await readInputs('lt-x', code, 1)).toEqual({ 1: 'x-r1' });
        expect(await readInputs('lt-x', code, 2)).toEqual({ 1: 'x-r2' });
        expect(await readInputs('lt-y', code, 1)).toEqual({ 1: 'y-r1' });
    });

    it('reads empty inputs for a round with no submissions', async () => {
        expect(await readInputs('lt-empty', 100107, 1)).toEqual({});
    });

    describe('per-seat private channel (host → one seat)', () => {
        it('a seat reads only its own private value', async () => {
            const ns = 'lt-priv';
            const code = 100108;
            await putPrivate(ns, code, 1, 2, { target: 73 });
            expect(await readPrivate<{ target: number }>(ns, code, 1, 2)).toEqual({ target: 73 });
            // A seat with no private value written gets null (never another seat's secret).
            expect(await readPrivate(ns, code, 1, 1)).toBeNull();
        });

        it('isolates private values by round and namespace, and overwrites in place', async () => {
            const code = 100109;
            await putPrivate('lt-p-x', code, 1, 1, 'x-r1');
            await putPrivate('lt-p-x', code, 2, 1, 'x-r2');
            await putPrivate('lt-p-y', code, 1, 1, 'y-r1');
            expect(await readPrivate('lt-p-x', code, 1, 1)).toBe('x-r1');
            expect(await readPrivate('lt-p-x', code, 2, 1)).toBe('x-r2');
            expect(await readPrivate('lt-p-y', code, 1, 1)).toBe('y-r1');
            await putPrivate('lt-p-x', code, 1, 1, 'x-r1-new');
            expect(await readPrivate('lt-p-x', code, 1, 1)).toBe('x-r1-new');
        });

        it('reads null for an unwritten private slot', async () => {
            expect(await readPrivate('lt-p-empty', 100110, 1, 1)).toBeNull();
        });
    });
});
