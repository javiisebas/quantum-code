import type { ComponentType } from 'react';

/**
 * How a game distributes secret information to phones:
 *  - 'shared'      → every joined phone sees the SAME secret (e.g. Codenames: the
 *                    spymasters all read the same colour map).
 *  - 'per-player'  → every phone sees a DIFFERENT secret, claimed by seat (e.g.
 *                    Spyfall / Undercover: each player gets their own card).
 */
export type GameSecrecy = 'shared' | 'per-player';

/**
 * Static, server-safe metadata describing a game. Pure data (no React), so it can be
 * imported by the arcade landing (server component) and by the API validators alike.
 */
export interface GameManifest {
    /** Stable id; also the Redis namespace and the URL segment (`/host/<id>`). */
    id: string;
    /** Display name, e.g. "Código Secreto". */
    name: string;
    /** One-line pitch shown on the arcade card. */
    tagline: string;
    /** Emoji used as the card glyph / favicon-ish marker. */
    emoji: string;
    /** Tailwind colour family token for card theming, e.g. 'purple' | 'rose' | 'emerald'. */
    accent: string;
    /** Player-count bounds (soft — used for copy + validation hints). */
    minPlayers: number;
    maxPlayers: number;
    /** Human-readable player count, e.g. "4+" or "3–8". */
    players: string;
    /** Human-readable typical duration, e.g. "15 min". */
    duration: string;
    /** Secret-distribution model (drives the join/seat flow). */
    secrecy: GameSecrecy;
    /**
     * How to play, as ordered steps — the content of the shared "¿Cómo se juega?" modal every
     * game now has. Rules used to be a single `hint` string dumped at the bottom of the lobby
     * (below the CTA, competing with it and pushing the screen past the fold), and only
     * Codenames had a real explanation — buried in its own bespoke dock. Structuring them here
     * lets one component render all eight identically, and keeps the lobby itself clean.
     *
     * Keep each step one short sentence, second person, imperative. 3–5 steps.
     */
    howTo: string[];
}

/**
 * Server-side game module: the manifest plus the pieces the generic room API needs
 * to store and validate a room's payload for this game.
 */
export interface GameServerModule {
    manifest: GameManifest;
    /** Redis namespace for this game's rooms (defaults to `manifest.id`). */
    namespace: string;
    /** Validate an untrusted room payload before it is written to the store. */
    validatePayload: (payload: unknown) => boolean;
    /**
     * For per-player-secret games: project the FULL stored payload down to the slice a
     * single `seat` may see, so `GET /api/room/[game]` never sends one phone another seat's
     * secret. When present, the room read is seat-token gated and returns only this seat's
     * view; when absent (shared games like Codenames, or live games), the read returns the
     * full payload as before. Receives the stored payload as `unknown` — each game casts it.
     */
    projectForSeat?: (payload: unknown, seat: number) => unknown;
}

/**
 * Client-side game module: the manifest plus the two screens every game provides.
 *  - `Host`   → the shared "board" screen (creates the room, shows the join code/QR).
 *  - `Player` → the phone screen for a joined player (null code → show a join form).
 */
export interface GameClientModule {
    manifest: GameManifest;
    Host: ComponentType;
    Player: ComponentType<{ code: number | null }>;
}
