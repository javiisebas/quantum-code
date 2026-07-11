# Quantum Code

A [Codenames](<https://en.wikipedia.org/wiki/Codenames_(board_game)>)-style party game built with the
Next.js App Router. One device acts as the shared **board**; spies join from their own phones using a
game code to see the secret role map.

## Stack

- **Next.js 15** (App Router) + **React 19**
- **TypeScript** (strict)
- **HeroUI** + **Tailwind CSS 3** for the UI
- **Framer Motion** for animations
- **Upstash Redis** as the backing store for game role maps (7‑day TTL)

## Getting started

Requires **Node 22+** and **pnpm 11+**.

```bash
pnpm install
cp .env.local.example .env.local   # then fill in your Upstash credentials
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

Create a free Redis database at [Upstash](https://console.upstash.com) and set:

| Variable                   | Description                         |
| -------------------------- | ----------------------------------- |
| `UPSTASH_REDIS_REST_URL`   | REST URL of your Upstash database   |
| `UPSTASH_REDIS_REST_TOKEN` | REST token of your Upstash database |

These are read by `Redis.fromEnv()` on the server. Never commit real credentials — `.env*` is gitignored.

## How it works

- **/** — landing page: start a new game, resume an in‑progress one, or join as a spy.
- **/play** — the shared board. Words and role assignments are generated locally and persisted to
  `localStorage`; the role map is also written to Redis under the game code so spies can fetch it.
- **/spy?code=XXXXXX** — a spy enters the game code and sees the colour map for that board.

Game rules live in [`src/consts.ts`](src/consts.ts): 25 words per board — 7 red, 6 blue, 11 neutral and
1 assassin (black).

## Scripts

| Script              | Description                   |
| ------------------- | ----------------------------- |
| `pnpm dev`          | Start the dev server          |
| `pnpm build`        | Production build              |
| `pnpm start`        | Serve the production build    |
| `pnpm lint`         | ESLint (Next.js config, flat) |
| `pnpm typecheck`    | `tsc --noEmit`                |
| `pnpm format`       | Format with Prettier          |
| `pnpm format:check` | Check formatting              |

## Project structure

```
src/
  app/               App Router routes (/, /play, /spy) + API (/api/roles)
    components/ui/   Shared UI primitives (Button, Icon, Modal)
  contexts/          Game + Modal React contexts
  services/          Pure game logic (shuffle, word/role generation, win check)
  helpers/           localStorage + className helpers
  enum/ · types/     Shared enums and types
  consts.ts          Board composition constants
```

Continuous integration (type check, lint, build) runs on every push and pull request via
[GitHub Actions](.github/workflows/ci.yml).
