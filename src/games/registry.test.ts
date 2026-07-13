import { describe, expect, it } from 'vitest';
import { gameLoaderIds, getGameLoader } from './game-loaders';
import { gameManifests, getManifest } from './registry';
import { getServerGame } from './registry.server';

/**
 * Registry integrity: guards the contract that makes adding a game safe. Every
 * catalogue manifest must be well-formed, have a matching server module (namespace +
 * validator), and its validator must reject junk. A game whose registration is
 * incomplete fails here instead of 404-ing at runtime.
 */
describe('game registry', () => {
    it('exposes at least the built-in games', () => {
        expect(gameManifests.length).toBeGreaterThanOrEqual(4);
    });

    it('has unique game ids', () => {
        const ids = gameManifests.map((m) => m.id);
        expect(new Set(ids).size).toBe(ids.length);
    });

    it.each(gameManifests)('manifest "$id" is well-formed', (manifest) => {
        expect(manifest.id).toMatch(/^[a-z-]+$/);
        expect(manifest.name.length).toBeGreaterThan(0);
        expect(manifest.tagline.length).toBeGreaterThan(0);
        expect(manifest.emoji.length).toBeGreaterThan(0);
        expect(manifest.minPlayers).toBeGreaterThanOrEqual(1);
        expect(manifest.maxPlayers).toBeGreaterThanOrEqual(manifest.minPlayers);
        expect(['shared', 'per-player']).toContain(manifest.secrecy);
        // The catalogue promises screens before you choose («Solo móviles» / «Necesita
        // pantalla»); a manifest without the answer would render a silent, lying card.
        expect(typeof manifest.needsSharedScreen).toBe('boolean');
        expect(getManifest(manifest.id)).toBe(manifest);
    });

    it.each(gameManifests)('game "$id" has a matching server module', (manifest) => {
        const mod = getServerGame(manifest.id);
        expect(mod).not.toBeNull();
        expect(mod!.namespace).toBe(manifest.id);
        expect(typeof mod!.validatePayload).toBe('function');
        // A validator must reject obvious junk.
        expect(mod!.validatePayload(null)).toBe(false);
        expect(mod!.validatePayload(undefined)).toBe(false);
        expect(mod!.validatePayload({})).toBe(false);
        expect(mod!.validatePayload('nope')).toBe(false);
    });

    it.each(gameManifests)('game "$id" has a client loader', (manifest) => {
        // Guards the other half of "adding a game is safe": a manifest with a
        // server module but no entry in `game-loaders.tsx` passes every other test
        // yet 500s at `/host/<id>`. Resolve it the same way the app routes do.
        const loader = getGameLoader(manifest.id);
        expect(loader).not.toBeNull();
        expect(loader).toHaveProperty('Host');
        expect(loader).toHaveProperty('Player');
        // `next/dynamic` yields a forwardRef component object, never undefined.
        expect(loader!.Host).toBeTruthy();
        expect(loader!.Player).toBeTruthy();
    });

    it('client loaders and manifests are in exact one-to-one correspondence', () => {
        // Bidirectional: catches both a missing loader (game 500s) and an orphan
        // loader (typo'd key, or one left behind after a game was removed).
        const manifestIds = new Set(gameManifests.map((m) => m.id));
        const loaderIds = new Set(gameLoaderIds);
        expect(loaderIds).toEqual(manifestIds);
    });

    it('returns null for unknown games', () => {
        expect(getManifest('does-not-exist')).toBeNull();
        expect(getServerGame('does-not-exist')).toBeNull();
        expect(getGameLoader('does-not-exist')).toBeNull();
    });
});
