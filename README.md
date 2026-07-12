# Quantum Arcade

A collection of **party games for one shared screen + everyone's phones**, built with the Next.js App
Router. One device is the **host** (the board/lobby everyone looks at); each player **joins from their phone**
with a 6-digit code (or by scanning a QR). Codenames was the first game; the repo is now a small **arcade
platform** you drop new games into.

## Games

| Game                    | Route                | Secret model  | Players |
| ----------------------- | -------------------- | ------------- | ------- |
| **Código Secreto** (Codenames) | `/host/codenames` | shared board  | 4+      |
| **¿Dónde está el espía?** (Spyfall) | `/host/spyfall` | per-player  | 3–12    |
| **Impostor** (Undercover) | `/host/undercover` | per-player   | 3–12    |
| **Hombres Lobo** (Werewolf) | `/host/werewolf` | per-player role | 4–16 |

## Stack

- **Next.js 15** (App Router) + **React 19**, **TypeScript** (strict)
- **HeroUI** + **Tailwind CSS 3**, **Framer Motion**
- **Upstash Redis** as the room store (7-day TTL); in-memory fallback in dev

## Architecture

```
src/
  platform/            ← game-agnostic engine + shared UI (the product's spine)
    room/              join codes, generic RoomStore<T> (namespace+code, atomic SET-NX,
                       seat claim), room HTTP client, presence, host/player hooks
    events/            outbound webhook seam (room lifecycle events)
    ui/                shared primitives (Button, Icon, Modal, ShareModal)
    persistence/       localStorage helpers + hooks
  games/
    registry.ts        catalogue (manifests) — the arcade landing reads this
    registry.server.ts server modules (namespace + payload validator per game)
    game-loaders.tsx   lazy Host/Player screens per game (code-split)
    _shared/           PerPlayerHost + PlayerShell (reused by per-player games)
    codenames/ spyfall/ undercover/ werewolf/   ← one folder per game
  app/
    page.tsx           arcade grid          /host/[game]   host screen
    join/              join by code + QR     /api/room/[game]  generic room API
```

The **room engine** is the reusable core: every game joins players the same way (code + Redis payload under
its own namespace), and per-player games share a `PerPlayerHost` lobby + `PlayerShell` (which claims a stable
seat per phone). **Presence** ("live" connected-player count) and an optional **outbound webhook** for room
events (`room.created` / `game.ended`) round out the platform.

### Adding a game

1. Create `src/games/<id>/` with a `manifest.ts` (metadata + `validatePayload`) and `Host`/`Player` screens.
   Per-player games reuse `_shared/PerPlayerHost` + `PlayerShell` — see `spyfall/` as the template.
2. Register it in `registry.ts`, `registry.server.ts`, and `game-loaders.tsx`.

The landing grid, routing (`/host/<id>`, `/join/<id>`), and the generic room API pick it up automatically.

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

| Variable                   | Description                                            |
| -------------------------- | ------------------------------------------------------ |
| `UPSTASH_REDIS_REST_URL`   | REST URL of your Upstash database                      |
| `UPSTASH_REDIS_REST_TOKEN` | REST token of your Upstash database                    |
| `QUANTUM_WEBHOOK_URL`      | _(optional)_ POST target for room lifecycle events     |

## Scripts

| Script              | Description                   |
| ------------------- | ----------------------------- |
| `pnpm dev`          | Start the dev server          |
| `pnpm build`        | Production build              |
| `pnpm lint`         | ESLint (Next.js flat config)  |
| `pnpm typecheck`    | `tsc --noEmit`                |
| `pnpm test`         | Vitest (domain + platform)    |
| `pnpm format`       | Format with Prettier          |

Continuous integration (audit, type check, lint, test, build) runs on every push and PR via
[GitHub Actions](.github/workflows/ci.yml).
