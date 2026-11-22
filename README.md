# KINORA

A social discovery and relationship platform centred on people of short stature, open to everyone who connects respectfully. Product brief: [`idea.md`](idea.md). Build plan: [`IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md). Current state: [`PROJECT_STATUS.md`](PROJECT_STATUS.md).

> **Status:** Phase 1 milestones 1.1–1.4 and 1.8 are done: scaffold, database, design system, sign-up and login, and the public website. Next: onboarding and profiles (1.5), verification (1.6), staff app (1.7).

## Requirements

- Node.js 22.12+ (24 recommended, see `.nvmrc`)
- pnpm 10 (`corepack enable` picks up the version pinned in `package.json`)
- Docker (Docker Desktop, Colima or OrbStack) for the local database

## Getting started

```bash
corepack enable
pnpm install
pnpm setup:env       # creates .env, apps/web/.env.local, apps/admin/.env.local with a generated secret
pnpm db:up           # start Postgres in Docker (port 5433)
pnpm db:migrate      # create the tables
pnpm dev
```

- Member app: http://localhost:3000
- Staff app: http://localhost:3001

To review the design system, set `ENABLE_DESIGN_PREVIEW=true` in `apps/web/.env.local` and open http://localhost:3000/design (see `DESIGN.md`).

Locally, emails (verification, password reset) aren't sent: with `DEV_MAILBOX=true` they're listed at http://localhost:3000/api/dev/mailbox.

Both apps validate their environment at startup and refuse to boot with a clear list of what's missing or invalid.

## Scripts

| Command | What it does |
|---------|--------------|
| `pnpm dev` | Run both apps in development |
| `pnpm build` | Production build of both apps |
| `pnpm lint` | ESLint across the monorepo |
| `pnpm typecheck` | TypeScript in every package, plus the e2e and config files |
| `pnpm test` | Unit tests, plus database integration tests when `TEST_DATABASE_URL` is set (Vitest) |
| `pnpm db:up` / `db:down` | Start or stop the local Postgres container |
| `pnpm db:migrate` | Apply migrations to `DATABASE_URL` |
| `pnpm db:generate` | Create a migration after editing `packages/db/src/schema` |
| `pnpm db:check` | Check migration history consistency |
| `pnpm jobs:purge-deleted` | Hard-delete accounts whose deletion grace period has passed |
| `pnpm test:e2e` | End-to-end tests (Playwright) against production builds. Run `pnpm build` first |
| `pnpm check` | lint + typecheck + unit tests |
| `pnpm format` | Prettier |
| `pnpm --filter @kinora/ui tokens` | Regenerate `tokens.css` after editing design tokens |

On first run, `pnpm exec playwright install chromium` downloads the test browser. To use an installed Google Chrome instead, set `PW_BROWSER_CHANNEL=chrome`.

## Layout

```
apps/web        Public site and member app (Next.js)
apps/admin      Staff app (Next.js, separate deploy, never indexed)
packages/core   Domain services: business rules, permissions, validation
packages/db     Drizzle schema, migrations, database client
packages/ui     Design tokens, theme, components, brand configuration
packages/config Env validation and security headers
e2e/            Playwright tests
```

See [`ARCHITECTURE.md`](ARCHITECTURE.md) for the rules that keep these boundaries.
