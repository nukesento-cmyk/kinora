# Testing

## How to run

```bash
pnpm db:up            # local Postgres, needed for database tests
pnpm check            # lint + typecheck + unit and database tests
pnpm build && pnpm test:e2e
```

Database integration tests run when `TEST_DATABASE_URL` is set (it's in `.env.example`). Without it they're skipped, not failed, so `pnpm test` still works on a machine with no database. Each test file creates its own throwaway database, applies every migration, and drops the database afterwards.

E2E starts production builds of both apps. If a server from an earlier session is still running on port 3000 or 3001, Playwright reuses it locally, so stop old servers after rebuilding.

## Current suites

| Suite | Location | Covers |
|-------|----------|--------|
| Unit (Vitest) | `packages/*/src/**/*.test.ts`, `apps/*/src/**/*.test.ts` | Env validation (no secret leakage). Security headers. Market parsing. Brand config. DB client. **Migration runner error messages and retry.** **WCAG contrast of every colour pairing in both themes.** **tokens.css drift.** Avatar initials. Design-preview flag. Message-file parity |
| Database integration (Vitest) | `packages/db/src/schema.integration.test.ts` | Migrations on an empty DB. Uniqueness. ISO country codes. No coordinate columns. Photo limits. Privacy defaults. Consent for self-identification. Adult discovery ages. No document columns. Deletion cascades. Staff permissions and no self-grant. Append-only audit log |
| E2E (Playwright) | `e2e/*.spec.ts` | Home page content and security headers. Health endpoints. Staff app noindex and no actions. **axe WCAG 2.2 A/AA scans of home (light and dark), design page (both themes) and staff home.** OS colour scheme. Field ARIA wiring. Loading button. 44px touch targets. Desktop and mobile |

## Latest results: 2026-11-22

| Check | Result |
|-------|--------|
| `pnpm lint`, `pnpm typecheck`, `pnpm format:check` | ✅ |
| `pnpm test` | ✅ 214/214 (unit + database integration) |
| `pnpm db:generate` drift check | ✅ No schema changes (3 migrations) |
| `pnpm build` | ✅ web and admin |
| `pnpm test:e2e` | ✅ 152 passed, 2 skipped by design (desktop-only and mobile-only nav tests), 0 axe violations |
| CI on GitHub | ⏳ Not run yet. No repository connected |

E2E now needs `DATABASE_URL` (the member app signs people up). The web server runs with `NODE_ENV=test` and `DEV_MAILBOX=true`, so the tests read verification and reset links from `/api/dev/mailbox`.

Auth e2e covers:
- register → verify → sign in → sessions → sign out
- under-18 rejection and the waitlist
- generic login error and the rate limit
- forgot/reset password
- delete and export (own data only)
- `/account/*` redirects and cookie flags

Site e2e checks every page in light and dark, desktop and mobile:
- status 200, a single h1, 0 axe violations
- keyboard nav, the mobile menu and Escape
- every internal link resolves
- no fake "N members" stats
- draft notices on legal pages, robots and sitemap

## Conventions

- Business rules live in `packages/core` and are unit-tested there. Data rules that must never break are enforced in the database and integration-tested.
- Every security and accessibility property gets a test that fails if it regresses.
- Mock data is allowed only in tests and fixtures (`idea.md` §2.9).
