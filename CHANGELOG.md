# Changelog

## 2026-11-22: Milestones 1.4 (sign-up and login) and 1.8 (public website)

### Added
- **Auth (Better Auth 1.7.27):**
  - Pages: register, sign in, email verification, forgot/reset password, account security (sessions, revoke, sign out everywhere, change password), delete account, export data.
  - 18+ and launch-market gate on every sign-up, with a waitlist for other countries.
  - Database-backed rate limits, CSP nonce via `proxy.ts`.
  - `Mailer` with Resend and the dev mailbox. `pnpm jobs:purge-deleted`.
  - Migration `0002_auth`.
- **Public website:**
  - 14 pages: home, about, discover, dating, community, events, stories, safety, membership, help, contact, privacy, terms, community guidelines.
  - Header with an accessible mobile menu, footer, `robots.ts`, `sitemap.ts`.
  - Legal pages as drafts under legal review. Membership plans with configurable prices.
- **UI:** `Select`, `PersonCard`, `Tag`.
- **Tests:** 214 unit and database tests, and 152 e2e (2 intentionally skipped) with axe in light and dark.

## 2026-11-21: Milestone 1.3, design system and localisation

### Added
- Design tokens (`packages/ui/src/tokens.ts`): light and dark palettes, type scale, shape, motion, touch target. Generated `tokens.css` with a drift test.
- WCAG contrast tests for 24 colour pairings × 2 themes.
- Tailwind v4 theme (`@kinora/ui/styles.css`) with self-hosted Schibsted Grotesk, focus ring and reduced-motion support.
- Components: Button, Field, Input, Textarea, Alert, Avatar (kin ring), Spinner, Skeleton, EmptyState, Panel.
- `/design` review page, off unless `ENABLE_DESIGN_PREVIEW=true`.
- next-intl in both apps, with English message files and a parity test. Home and staff pages now read all copy from messages.
- axe accessibility scans in e2e (light and dark), plus ARIA, loading-state and touch-target checks.
- `DESIGN.md`.

### Fixed
- `pnpm db:migrate` failed with no explanation. It now uses our own runner that waits for the database and explains connection, user, password and missing-database errors.

## 2026-11-21: Milestone 1.2, database foundation

### Added
- Phase 1 schema (10 tables): profiles, profile photos, member self-identification, privacy settings, discovery preferences, verification requests, staff roles/permissions/assignments, audit logs.
- Migrations `0000_init` and `0001_audit_logs_append_only`.
- Local Postgres 18 via `docker-compose.yml`, plus root scripts `db:up`, `db:down`, `db:migrate`, `db:generate`, `db:check`.
- 16 database integration tests on throwaway databases.
- CI: Postgres service, schema/migration drift check, migration apply, integration tests.
- `DATABASE.md`.

### Changed
- Database client now uses node-postgres instead of Neon's HTTP driver, so one driver works locally, in CI and on Neon.
- Auth plan for 1.4: self-hosted Better Auth instead of Neon managed auth.

## 2026-11-21: Milestone 1.1, scaffold and CI

### Added
- pnpm monorepo: `apps/web`, `apps/admin`, `packages/core`, `packages/db`, `packages/ui`, `packages/config`.
- Next.js 16.4 apps with TypeScript strict, Tailwind 4 and React 19.3.
- Startup env validation (`@kinora/config`) and baseline security headers on every route.
- Launch-market configuration (`LAUNCH_MARKETS`) with registration/waitlist logic in `@kinora/core`.
- Configurable brand (`@kinora/ui`).
- Drizzle + Neon client in `@kinora/db` (no tables yet).
- ESLint rule blocking direct database access from apps.
- Vitest (17 tests) and Playwright (8 tests, desktop and mobile).
- GitHub Actions CI: format, lint, typecheck, unit tests, build, e2e.
- Docs: README, ARCHITECTURE, SECURITY, TESTING.

## 2026-11-21: Phase 0

- Audit (greenfield), implementation plan, provider research.
