# Quantum Arcade

A collection of **party games for one shared screen + everyone's phones**, built with the Next.js App
Router. One device is the **host** (the board/lobby everyone looks at); each player **joins from their phone**
with a 6-digit code (or by scanning a QR). Codenames was the first game; the repo is now a small **arcade
platform** you drop new games into.

## Games

| Game                                | Route              | Secret model    | Players |
| ----------------------------------- | ------------------ | --------------- | ------- |
| **Código Secreto** (Codenames)      | `/host/codenames`  | shared board    | 4+      |
| **Chispas**                         | `/host/chispas`    | live (phases)   | 3–10    |
| **El Camaleón**                     | `/host/camaleon`   | per-player      | 3–12    |
| **Sintonía**                        | `/host/sintonia`   | live (phases)   | 3–10    |
| **La Bomba**                        | `/host/bomba`      | live (phases)   | 3–12    |
| **¿Dónde está el espía?** (Spyfall) | `/host/spyfall`    | per-player      | 3–12    |
| **Impostor** (Undercover)           | `/host/undercover` | per-player      | 3–12    |
| **Hombres Lobo** (Werewolf)         | `/host/werewolf`   | per-player role | 4–16    |

## Stack

- **Next.js 15** (App Router) + **React 19**, **TypeScript** (strict)
- **HeroUI** + **Tailwind CSS 3**, **Framer Motion**
- **Upstash Redis** as the room store (7-day TTL); in-memory fallback in dev

## Architecture

```
src/
  platform/            ← game-agnostic engine + shared UI (the product's spine)
    room/              join codes + arcade-wide code index, generic RoomStore<T>
                       (namespace+code, atomic SET-NX, seat claim), room HTTP client,
                       presence, host/player hooks
    events/            outbound webhook seam (room lifecycle events)
    ui/                shared primitives (Screen, TopBar, Surface, Button, Modal…) and
                       the shared screens (HostLobby, LobbyPanel, JoinScreen, RoomShare)
    persistence/       localStorage helpers + hooks
  games/
    registry.ts        catalogue (manifests) — the arcade landing reads this
    registry.server.ts server modules (namespace + payload validator per game)
    game-loaders.tsx   lazy Host/Player screens per game (code-split)
    _shared/           PerPlayerHost + PlayerShell + live/ (LiveLobby, LivePlayerShell)
    codenames/ spyfall/ undercover/ werewolf/   ← one folder per game
  app/
    page.tsx           arcade catalogue      /host/[game]   host screen (shared screen)
    join/              the ONE join screen    /join/[game]  a game's phone screen
    j/[code]/          short join link (what the QR encodes) → resolves to its game
    api/join/[code]/   code → game            /api/room/[game]  generic room API
```

The **room engine** is the reusable core: every game joins players the same way, and every game waits in the
same `HostLobby`. **Presence** ("live" connected-player count) and an optional **outbound webhook** for room
events (`room.created` / `game.ended`) round out the platform.

### A join code is a PLATFORM identity, not a game's

Rooms are stored per game (`bomba:611274`), but codes are **reserved arcade-wide** in a `code:<code> → game`
index, so six digits name exactly one room. Codes are therefore minted by the **server** (`POST /api/room/
<game>` with no code → it allocates and reserves one): only the store can see every game's reservations.

That single invariant is what lets a player type a code and land in the right game — so the join flow asks for
**nothing but the code**. (It used to make the player pick the game from a list, which is a question only the
server can answer; picking wrong silently dropped them into an empty form for a game nobody was playing.)
`GET /api/join/<code>` resolves a code, and `/j/<code>` — the short link the QR encodes — redirects to it.

### Adding a game

1. Create `src/games/<id>/` with a `manifest.ts` (metadata, `howTo` steps, `validatePayload`) and
   `Host`/`Player` screens. Reuse a scaffold rather than building a lobby: `_shared/PerPlayerHost` for
   deal-a-secret-per-seat games (see `spyfall/`), `_shared/live/LiveLobby` for phase-based live games (see
   `bomba/`). Both render the shared `HostLobby`, so a new game gets the arcade's lobby for free.
2. Register it in `registry.ts`, `registry.server.ts`, and `game-loaders.tsx`.

The catalogue, routing (`/host/<id>`, `/join/<id>`), the join flow, the `¿Cómo se juega?` modal (from
`manifest.howTo`) and the generic room API all pick it up automatically.

### UI conventions

- Every screen sits in `<Screen>`. `height="fit"` means **exactly one viewport, no page scroll** — the join
  code, the QR and the primary action are load-bearing and must never be scrolled to. Anything that can
  outgrow the screen (a roster, a results table) claims `flex-1 min-h-0` and scrolls **inside itself**.
- `short:` is a **height** breakpoint (`max-height: 720px`), not a width one: it's where a layout trades
  ceremony (padding, QR size, stacked → side-by-side) for information, so an SE-sized phone clips nothing.
- One primary action per screen. Navigation is chrome and lives in `<TopBar>`, never as a button competing
  with the CTA. A disabled control says what it is waiting for ("Faltan 2 jugadores"), rather than being
  explained by a caption underneath it.

## Getting started

Requires **Node 22+** and **pnpm 11+**.

```bash
pnpm install
cp .env.local.example .env.local   # add your Upstash credentials (optional in dev)
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Without Redis credentials the app uses an in-memory
store (dev only), so you can play locally on a single machine.

### Environment variables

| Variable                   | Description                                        |
| -------------------------- | -------------------------------------------------- |
| `UPSTASH_REDIS_REST_URL`   | REST URL of your Upstash database                  |
| `UPSTASH_REDIS_REST_TOKEN` | REST token of your Upstash database                |
| `QUANTUM_WEBHOOK_URL`      | _(optional)_ POST target for room lifecycle events |

## Scripts

| Script           | Description                  |
| ---------------- | ---------------------------- |
| `pnpm dev`       | Start the dev server         |
| `pnpm build`     | Production build             |
| `pnpm lint`      | ESLint (Next.js flat config) |
| `pnpm typecheck` | `tsc --noEmit`               |
| `pnpm test`      | Vitest (domain + platform)   |
| `pnpm format`    | Format with Prettier         |

Continuous integration (audit, type check, lint, test, build) runs on every push and PR via
[GitHub Actions](.github/workflows/ci.yml).
