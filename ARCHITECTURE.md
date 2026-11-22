# Architecture

_Describes what exists now. Planned work lives in `IMPLEMENTATION_PLAN.md`._

## Shape

A **modular monolith** in a pnpm monorepo: two Next.js apps share domain packages. No microservices (`idea.md` §5).

```
apps/web ─┐                ┌─> packages/db (Drizzle + Postgres)
          ├─> packages/core ┤
apps/admin┘                └─> packages/config (env, headers)
          └─> packages/ui ──> packages/config
```

## Boundaries (enforced)

| Rule | How it's enforced |
|------|-------------------|
| Apps never import `@kinora/db` directly. Data access goes through `@kinora/core` services. | ESLint `no-restricted-imports` in `eslint.config.mjs` |
| No hardcoded brand name, contacts or countries | Brand from `@kinora/ui` `getBrand()`. Launch markets from `LAUNCH_MARKETS` via `@kinora/core` `markets` |
| Every environment variable is validated | `@kinora/config` `parseEnv()`. Apps validate at boot in `src/instrumentation.ts` |
| Same security headers on every route | `@kinora/config` `securityHeaders()` wired into each `next.config.ts` |
| Staff app is never indexed | `X-Robots-Tag` header plus robots metadata, checked by e2e test |

## Packages

- **`@kinora/config`**: `parseEnv` (Zod validation that names bad variables but never echoes their values), `sharedEnvSchema`, `securityHeaders`.
- **`@kinora/core`**: one folder per domain. Currently `markets`, which parses the launch-market list and decides whether a country is open for registration or waitlisted.
- **`@kinora/db`**: `createDb()` returns a Drizzle client on node-postgres. The Phase 1 schema has 10 tables with committed SQL migrations (see `DATABASE.md`). `src/testing/` creates throwaway migrated databases for integration tests.
- **`@kinora/ui`**: design tokens (`tokens.ts`, source of truth) generating `styles/tokens.css`, a Tailwind v4 theme (`styles.css`), shared components, `cn()`, WCAG contrast helpers and `getBrand()`. See `DESIGN.md`.
- **Localisation**: next-intl in both apps, without locale URLs for now. Copy lives in `apps/*/messages/<locale>.json` and the locale is resolved in `src/i18n/request.ts`.

Workspace packages are consumed as TypeScript source (`exports` → `src/*.ts`) and compiled by each Next.js app through `transpilePackages`. There's no separate build step.

## Decisions

| Date | Decision | Reason |
|------|----------|--------|
| 2026-11-21 | TypeScript 6.0, not 7.0 | `typescript-eslint` 8.x supports TypeScript below 6.1 only |
| 2026-11-21 | ESLint 9, not 10 | `eslint-config-next` 16 depends on React, import and a11y plugins that support ESLint up to 9 |
| 2026-11-21 | Vitest 5, Node 22.12+ | Vitest 5's engine requirement |
| 2026-11-21 | Browser geolocation disabled via `Permissions-Policy` | Discovery uses coarse, member-entered locations only (`idea.md` §10) |
| 2026-11-21 | Launch markets are configuration | `idea.md` §23: never hardcode Kenya or any other country |
| 2026-11-21 | Local Docker Postgres for development; Neon later | Your Neon org is Vercel-managed, so the Neon project must be created through Vercel. Development doesn't wait on it |
| 2026-11-21 | node-postgres driver instead of Neon's HTTP driver | One driver for local, CI and Neon. The HTTP driver can't reach a local database |
| 2026-11-21 | Self-hosted Better Auth in milestone 1.4, instead of Neon's managed auth | Managed auth requires Neon. Self-hosted Better Auth is the same library, stores users in our own Postgres and works locally. Revisit when moving to Neon |
| 2026-11-21 | Audit log immutability enforced in the database (trigger) | Even a bug or compromised app code can't rewrite history |
| 2026-11-21 | Self-identification in its own table with required consent | May be health/disability data (Kenya DPA, GDPR Art. 9) |
| 2026-11-21 | Own migration runner instead of `drizzle-kit migrate` | drizzle-kit exits without showing connection and auth errors |
| 2026-11-21 | Tokens in TypeScript, CSS generated and drift-tested | One source for code and CSS. Contrast is tested on the same values the CSS uses |
| 2026-11-21 | shadcn/ui-style components written into `packages/ui`, no Radix yet | The components so far are plain HTML. Radix comes in when we need dialogs and menus |
| 2026-11-21 | Font self-hosted via Fontsource, not `next/font/google` | No build-time call to Google, and no third-party font requests from members' browsers |
| 2026-11-21 | Brand and launch markets are read at build time for static pages | Changing them needs a redeploy, which is acceptable for settings that rarely change |
| 2026-11-22 | Better Auth 1.7, self-hosted, configured in `@kinora/core/identity` (`createAuth`) | The rules live in core and are unit-tested. The app only wires routes and pages |
| 2026-11-22 | Server actions call Better Auth through its HTTP router, not `auth.api` | Only the router applies rate limiting and origin checks |
| 2026-11-22 | Per-request CSP nonce in `proxy.ts` | Strong XSS protection. The cost is that member-app pages render per request instead of being static |
| 2026-11-22 | `Mailer` interface with Resend (fetch) and a dev mailbox | No email SDK. The dev mailbox can't run in production (boot check) |
| 2026-11-22 | Site pages and nav from one routes registry (`apps/web/src/site/routes.ts`) | Header, footer and sitemap can't drift apart |
| 2026-11-22 | Membership plans in `@kinora/core/membership`. Prices from `MEMBERSHIP_PRICES`, hidden when unset | Prices are configurable per market and never invented |
