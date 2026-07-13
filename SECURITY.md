# Security Policy

## Reporting a vulnerability

Please report security issues **privately** — do not open a public issue.

- Preferred: open a [private security advisory](https://github.com/javiisebas/quantum-code/security/advisories/new).
- Or email the maintainer: javi.sebas171@gmail.com

We aim to acknowledge reports within 72 hours.

## Supply-chain protections

This project defends its dependency chain in depth. No single control is a point of failure:

| Layer                        | Control                                                                                                                       | Where                                                  |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| **Cooling-off window**       | `minimumReleaseAge: 4320` (3 days) — a freshly-compromised release cannot enter the lockfile before it is caught and yanked   | [`pnpm-workspace.yaml`](pnpm-workspace.yaml)           |
| **Reproducible installs**    | `pnpm install --frozen-lockfile` in CI and Vercel — builds install exactly the reviewed lockfile, never a drifting resolution | [`.github/workflows/ci.yml`](.github/workflows/ci.yml) |
| **CI audit gate**            | `pnpm audit --audit-level=high` fails the build on any known high/critical advisory                                           | [`.github/workflows/ci.yml`](.github/workflows/ci.yml) |
| **Automated alerts + fixes** | Dependabot alerts and automated security PRs are enabled at the repo level                                                    | GitHub repo settings                                   |
| **Scheduled updates**        | Dependabot opens weekly grouped update PRs for npm deps and CI actions                                                        | [`.github/dependabot.yml`](.github/dependabot.yml)     |
| **Pinned CI actions**        | GitHub Actions are pinned to full commit SHAs, not mutable tags                                                               | [`.github/workflows/ci.yml`](.github/workflows/ci.yml) |
| **Vetted build scripts**     | Only explicitly allow-listed packages may run install scripts (`allowBuilds`)                                                 | [`pnpm-workspace.yaml`](pnpm-workspace.yaml)           |

### Urgent security patch newer than the cooling-off window

If a critical fix is published less than 3 days ago and you need it now, add the package
to a `minimumReleaseAgeExclude` list in [`pnpm-workspace.yaml`](pnpm-workspace.yaml), or
install it from a clean checkout, then restore the setting.

## Secrets

No `.env*` file is tracked in git (`.gitignore` covers them). Runtime secrets
(e.g. Upstash Redis credentials) live only in Vercel environment variables and local
`.env.local`. Rotate any credential that is ever pasted into a shell, log, or chat.
