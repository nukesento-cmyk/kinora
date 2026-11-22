# KINORA — TODO

_Last updated: 2026-11-21_

## Waiting on you
- [x] D1: Business country: Kenya now, Delaware later
- [ ] D2: Confirm launch markets: recommended `KE` first (see `IMPLEMENTATION_PLAN.md` §2a)
- [x] D3: Hosting: Vercel
- [ ] D4: GitHub repo. Either connect GitHub to Claude so I can push, or create a private repo yourself and push this folder (`git init && git add . && git commit -m "Milestones 1.1–1.2" && git remote add origin <url> && git push -u origin main`)
- [ ] Save the CI workflow (sent in chat) as `.github/workflows/ci.yml`. Claude can't write into `.github` folders on your computer. **Use the latest version, which adds the database checks**
- [x] D5: Local Docker Postgres for development. Neon (through Vercel Storage) before the first deploy
- [ ] D6: Trademark and domain checks for "KINORA"

## Phase 1
- [x] 1.1 Scaffold monorepo, tooling and CI (verified locally: lint, typecheck, unit tests, build, 8 e2e)
- [x] 1.2 Database: 10 tables, 2 migrations, local Docker Postgres, 16 integration tests, CI drift check
- [x] 1.3 Design tokens, themes, components, `/design` review page, next-intl, axe scans
- [ ] Brand assets: logo and favicon, once the name checks (D6) are done
- [x] 1.4 Sign-up and login: Better Auth, 18+ and market gate, waitlist, sessions, deletion and purge job, export, CSP, rate limits
- [ ] 1.5 Onboarding, profiles, secure photo pipeline (strip EXIF/GPS, private signed URLs)
- [ ] 1.6 Verification: Smile ID (if D2 is confirmed as Kenya-first)
- [ ] 1.7 Admin app: staff MFA, permissions, audit log writes
- [x] 1.8 Public website: 14 pages, legal drafts, configurable prices
- [ ] Confirm the three public commitments on the site: "Safety tools are part of every membership", "We don't sell members' personal data", "Payment is kept separate from verification"
- [ ] 1.9 Phase 1 close-out against `idea.md` §26

## Before first deployment
- [ ] Create the Neon database through Vercel Storage (Frankfurt), run `pnpm db:migrate` against it
- [ ] Separate least-privilege database role for the app (no DDL, no access to drop triggers)

## Tech follow-ups
- [ ] Schedule `pnpm jobs:purge-deleted` daily (Vercel Cron or Inngest) at deployment
- [ ] Apple sign-in. Test Google sign-in against real Google credentials
- [ ] Trim the client message payload: send only the namespaces each page needs
- [ ] Lighthouse run (target ≥ 95)
- [ ] Move to ESLint 10 and TypeScript 7 once `eslint-config-next` and `typescript-eslint` support them
- [ ] Add dependency vulnerability scanning to CI

## Before launch (not code)
- [ ] Privacy impact assessment (verification and self-identification data)
- [ ] Check whether ODPC data controller registration applies
- [ ] Legal review of Privacy Policy, Terms and Community Guidelines
- [ ] Confirm Paystack accepts a dating/social platform
