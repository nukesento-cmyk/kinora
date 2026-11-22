# KINORA — Project Status

_Last updated: 2026-11-22_

## Current phase
**Phase 1, Foundation.** Milestones 1.1–1.4 and 1.8 are ✅ complete. Next: 1.5 onboarding and profiles, 1.6 verification, 1.7 staff app.

## What exists
| Item | State |
|------|-------|
| Monorepo | ✅ `apps/web`, `apps/admin`, `packages/core`, `packages/db`, `packages/ui`, `packages/config` |
| Env validation and security headers | ✅ Both apps, tested |
| Launch-market gating logic | ✅ `@kinora/core` markets, configured with `LAUNCH_MARKETS` |
| Database | ✅ Local Docker Postgres. 10 Phase 1 tables, 2 migrations (see `DATABASE.md`) |
| Design system | ✅ Tokens, light/dark themes, 10 components, `/design` review page (see `DESIGN.md`) |
| Localisation | ✅ next-intl. English message files in both apps |
| Sign-up and login | ✅ Register, verify email, sign in, reset password, sessions, delete, export (see `SECURITY.md`) |
| Public website | ✅ 14 pages, legal drafts, configurable membership prices |
| Tests | ✅ 214 unit and database, 152 e2e, 0 accessibility violations (see `TESTING.md`) |
| CI workflow | ✅ Written, now with Postgres and migration checks. ⏳ Not run yet: no GitHub repo, and the file must be saved by hand |
| Hosted database | ⏳ Neon later, created through Vercel Storage |
| Deployments | ⏳ None. Vercel chosen, no repo yet |

## Decisions
D1 Kenya → Delaware ✅ · D2 launch markets (Kenya first recommended, needs your OK) · D3 Vercel ✅ · D4 GitHub repo ⏳ · D5 local DB now, Neon via Vercel later ✅ · D6 brand checks ⏳

## Milestone checklist (idea.md §26)
| Milestone | Status |
|-----------|--------|
| 1.1 Scaffold and CI | ✅ Done locally. CI pending repo |
| 1.2 Database foundation | ✅ Done locally. CI pending repo |
| 1.3 Design system and localisation | ✅ Done locally. CI pending repo |
| 1.4 Sign-up and login | ✅ Done locally. CI pending repo |
| 1.5–1.7 | Not started |
| 1.8 Public website | ✅ Done locally. Legal pages are drafts for lawyer review |
| 1.9 Close-out | Not started |
