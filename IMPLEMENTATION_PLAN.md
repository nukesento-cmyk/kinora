# KINORA — Implementation Plan

_Last updated: 2026-11-22 · Status: Phase 0 complete. Phase 1 milestones 1.1–1.4 and 1.8 complete. Next: 1.5, 1.6, 1.7._

This plan turns `idea.md` into an ordered build. Where this file and `idea.md` disagree, `idea.md` sets the requirements and this file records how and in what order we meet them.

---

## 1. Starting point (Phase 0 findings)

- The `kinora` folder holds only `idea.md`. There is no code, no repository, no database and no prior architectural decision.
- So the Phase 0 "repository audit" comes down to one finding: **this is a greenfield build.** There is nothing to preserve or migrate, and no existing work could be duplicated.
- The docs `idea.md` lists (README, ARCHITECTURE, DATABASE, SECURITY, API, TESTING, CHANGELOG) are created in milestone 1.1. They must describe real code, so they are not written ahead of it. This plan, `PROJECT_STATUS.md` and `TODO.md` are the only docs that exist before code.

---

## 2. Decisions

| # | Decision | Status |
|---|----------|--------|
| D1 | Business registration country | ✅ **Kenya now, moving to a Delaware entity later.** Payments start on Paystack. Phase 5 builds a provider interface so Stripe can be added after the move without touching entitlement logic. |
| D2 | Launch markets | ✅ **Researched. Recommendation in §2a.** Awaiting your confirmation. |
| D3 | Hosting | ✅ **Vercel** for both apps. |
| D4 | GitHub repository | ⏳ **Open.** No GitHub account is connected to Claude, so I couldn't create or push to a repo. CI is ready to run as soon as a repo exists. |
| D5 | Database hosting | ✅ **Local Docker Postgres for now.** Your Neon organisation is Vercel-managed, so the hosted database will be created through Vercel Storage when we deploy. The same migrations apply unchanged. |
| D6 | Brand name checks | ⏳ Open. Doesn't block code. |

---

## 2a. Launch markets (D2 recommendation)

Signups are gated by country through `LAUNCH_MARKETS`, already built in milestone 1.1. Opening a country is a config change, and everyone else can join a waitlist. That lets KINORA launch small and expand only once safety, payments and legal work are ready for each region.

| Wave | Markets | Why | What must be ready first |
|------|---------|-----|---------------------------|
| **1: Launch** | **Kenya** | Home market. The business is registered there and Paystack takes M-PESA and cards in KES/USD. Smile ID can verify Kenyan National IDs against government records. The team understands the community and the language. | ODPC registration check, DPIA, legal pages for Kenya |
| **2: Africa** | Nigeria, Ghana, South Africa (plus Uganda, Tanzania, Rwanda for card-paying members) | Paystack operates in Nigeria, Ghana, South Africa, Kenya and Côte d'Ivoire, and accepts international Visa and Mastercard. Smile ID covers these markets. | Nigeria: check NDPC "major importance" registration. Local payment methods only where we have an entity or partner |
| **3: Global English** | US, UK, Canada, Australia, then the EU | Largest organised communities: Little People of America estimates about 30,000 people with dwarfism in the US and runs 70 chapters. Wave 3 waits for the Delaware entity and Stripe. | **UK:** Online Safety Act duties. Ofcom has dating-specific guidance flagging harassment and stalking risks and requiring reporting tools. **US:** a growing state-by-state patchwork of age-verification and app-store laws. **EU:** GDPR Art. 9 (health data) and the DSA |

**Recommendation:** launch with `LAUNCH_MARKETS=KE`. Start the Wave 2 legal checks during Phase 3, and plan Wave 3 to follow the Delaware move. The verification vendor for 1.6 is then **Smile ID**, for Kenyan National ID coverage. Veriff stays the option to review before Wave 3.

---

## 3. Recommended stack and providers

`idea.md` fixes the core stack: Next.js, TypeScript, Tailwind, shadcn/ui, Motion, PostgreSQL, Drizzle, Zod, Vitest, Playwright and GitHub Actions. Below are the provider choices it left open, researched November 2026. Each external service sits behind a small interface in `packages/core` so it can be swapped later.

### 3.1 Database: Neon (Postgres)
- Serverless Postgres with branching: one branch each for dev, every preview deployment and production.
- Drizzle works with it natively. Migrations live in the repo.
- **Status:** chosen for hosting, deferred. Development runs on a local Docker Postgres 18 (same major version Neon runs). The Neon project will be created through Vercel Storage before the first deployment.

### 3.2 Authentication: Better Auth (self-hosted in the app, decided 2026-11-21)
- **Update:** because development uses a local database, milestone 1.4 uses self-hosted Better Auth with its tables in our own Postgres. That's the same library as Neon's managed version, and it works locally, in CI and on Neon. The original notes on the managed option follow.
- Neon's managed auth is built on Better Auth. Users and sessions live in our own Postgres, in a `neon_auth` schema, so auth data branches along with the rest of the database. That gives safe testing of sign-up, password reset and deletion flows on preview branches.
- It handles verification, OTP, magic-link and password-reset emails without a separate mailer.
- **Fallback:** self-hosted Better Auth inside the Next.js app, if we need a feature the managed version lacks. Same library, same data model.
- **Why not Clerk:** Clerk is managed and closed-source and keeps identity outside our database. It does have the most mature React Native/Expo SDK. Better Auth added Expo support in 2026. We'll recheck this before the mobile phase.
- Staff accounts for the admin app have mandatory MFA and are kept separate from member accounts.

### 3.3 Media storage: Cloudflare R2
- S3-compatible with **no egress fees**. Storage is $0.015/GB-month. A photo-heavy social app is mostly reads, so free egress is the deciding factor.
- Buckets are private by default. Uploads use short-lived presigned URLs, and private photos are served through short-lived signed URLs, never predictable public paths (`idea.md` §9).
- **Alternative:** Neon Object Storage (GA September 2026) branches together with the database. That's useful for test fixtures, but we haven't compared its pricing for heavy image egress.
- **Identity documents are never stored by KINORA.** They stay with the verification vendor. We keep only the result and a vendor reference (data minimisation, `idea.md` §16).

### 3.4 Realtime messaging: Ably (Postgres stays the source of truth)
- Ably Chat covers 1:1 and group messaging, edit/delete, reactions, typing indicators and moderation hooks, which matches `idea.md` §13.
- Messages are written to Postgres first through our API, which also enforces permissions, blocks and rate limits. Ably only fans them out. If Ably ever goes down, no history is lost.
- **Watch:** Neon Realtime (public beta October 2026) turns SQL queries into live queries. It's promising for feeds and notifications. Not for messaging until it's out of beta.

### 3.5 Background jobs: Inngest
- Event-driven durable functions with retries, triggered from Next.js routes. Examples: `match.created` → notify both members, `account.deletion_requested` → hard delete after the grace period, `export.requested` → build the data export.
- **Alternative:** Trigger.dev, which is better for long-running work (video processing) and fully self-hostable. We'll revisit if we need tasks longer than a few minutes.

### 3.6 Payments: depends on D1
- **Paystack** (owned by Stripe) is live for all businesses in Kenya. It supports cards, M-PESA, Airtel Money and Apple Pay, plus a subscriptions API. Pricing is 1.5% on M-PESA and 2.9% on cards.
  - **Important constraint:** M-PESA does not support automatic recurring charges through Paystack. Card subscriptions renew automatically. M-PESA members need a prompt each billing cycle, or prepaid periods (for example, buy 1 or 3 months). The entitlement model in Phase 5 has to support both.
- **Stripe:** Kenya appears on Stripe's list only as an "Extended network" market, which Stripe doesn't clearly define. Treat Stripe as an option only with a US/UK/EU entity.
- **Merchant-of-record services are out:** Paddle's acceptable use policy explicitly forbids dating services/apps.
- **Mobile (Phase 6):** the app stores have their own in-app billing rules for digital subscriptions. Check them before designing mobile checkout.
- Whatever the provider: webhook signature verification, an idempotency table for webhook events, and entitlements granted only from server-confirmed events (`idea.md` §17).

### 3.7 Transactional email: Resend
- A good fit for a TypeScript/React stack (React Email templates) with a free tier for development.
- **Switch to Postmark** if deliverability of critical mail (password resets, security alerts) becomes a problem. Postmark keeps transactional and bulk email on separate streams.
- Auth emails can come from Neon's managed auth at first. Resend covers everything else (match notifications, event reminders, receipts).

### 3.8 Identity and age verification: shortlist, pick at milestone 1.6 (depends on D2)
- **Veriff:** has a dating-specific package with selfie checks, ID-based age verification and AI age estimation. Global coverage.
- **Smile ID:** strongest African coverage. Certified liveness detection, and checks against national ID databases in 10 countries.
- **Persona:** configurable verification flows, global.
- Verification is **optional** and earns a badge. It must never be a condition of joining (`idea.md` §8). Age eligibility at signup is a server-checked date of birth. Vendor checks are used where the law requires them or for flagged accounts.

### 3.9 Hosting: Vercel (D3)
- Web app and admin app as separate Vercel projects from one monorepo, with a preview deployment and Neon branch per pull request.

### 3.10 Deliberately not chosen yet
- Push notifications, map rendering, analytics and AI providers. `idea.md` schedules these for later phases, and choosing now would be premature.

---

## 4. Repository layout

`idea.md` asks for a separate staff application and a future mobile app that share API contracts. That needs a monorepo. We use pnpm workspaces and add Turborepo only if build times call for it.

```
kinora/
├── apps/
│   ├── web/            # Public site + member app (Next.js)
│   ├── admin/          # Staff application (Next.js), separate deploy and auth policy
│   └── mobile/         # Phase 6 (Expo), not created until then
├── packages/
│   ├── core/           # Domain services: business logic, permissions, validation (no UI)
│   │   └── src/<domain>/   identity, profiles, verification, discovery, matching, …
│   ├── db/             # Drizzle schema (one file per domain), migrations, seed fixtures
│   ├── ui/             # Shared components, design tokens, brand config
│   └── config/         # Shared TS, ESLint, Tailwind and env-validation config
├── docs/               # (moves here once code exists)
├── idea.md
└── IMPLEMENTATION_PLAN.md
```

Rules:
- UI components never query the database directly. `apps/*` call `packages/core` services, which own permissions and data access. This keeps the modular monolith boundaries from `idea.md` §5.
- Every environment variable is validated with Zod at startup. No hardcoded URLs, contacts, prices or keys.
- Brand (name, logo, colours, contact details) lives in one config module plus env vars.

---

## 5. Phase 1: Foundation, broken into milestones

Order: **1.1 → 1.2 → 1.3 → 1.4 → 1.5 → (1.6 ‖ 1.7) → 1.9**. Milestone 1.8 (public site) can start once 1.3 is done and run alongside the rest.

### 1.1 Scaffold and CI
- pnpm monorepo, Next.js (latest stable) with TypeScript strict, Tailwind and shadcn/ui.
- ESLint, Vitest, Playwright, plus a GitHub Actions pipeline: typecheck, lint, unit tests, a migration check against a fresh Neon branch, and e2e on preview.
- First versions of README, ARCHITECTURE, SECURITY and TESTING, describing what actually exists.
- **Done when:** a pull request runs green CI and gets a preview URL.

### 1.2 Database foundation ✅ (2026-11-21)
- Built on local Docker Postgres (Neon deferred, see D5): Drizzle, 2 migrations, 10 tables (see `DATABASE.md`).
- Differences from the original plan:
  - Added `staff_role_assignments`.
  - Dropped country and language reference tables. ISO codes are validated by constraints instead, which avoids unnecessary tables (`idea.md` §20).
- **Done:** migrations apply cleanly to an empty database, there's a drift check, and 16 integration tests pass. CI is configured and will run once a repo exists.

### 1.3 Brand system and localisation base ✅ (2026-11-21)
- Design tokens (neutral surfaces, one accent palette, type scale, spacing, motion), checked for accessible contrast.
- Configurable brand module and an i18n setup with English first, so all copy comes from message files.
- **Done when:** the token page and core components render in light and dark modes and pass contrast checks.
- **Done:** tokens with contrast tests (48 pairings), generated CSS, 10 components, `/design` review page, next-intl, and axe scans with 0 violations in both themes. See `DESIGN.md`.

### 1.4 Authentication ✅ (2026-11-22)
- Email and password sign-up, email verification, password reset, and Google/Apple sign-in.
- Session management and an account security page (active sessions, sign out everywhere).
- 18+ check on date of birth, enforced on the server.
- Account deletion: immediate deactivation, a grace period, then a hard delete through an Inngest job.
- Data export: a job builds an archive and emails a time-limited link.
- **Done when:** e2e tests cover sign-up → verify → sign-in → reset → delete, and security tests cover session fixation and brute-force limits.

### 1.5 Onboarding and profiles
- Guided onboarding with only the fields from `idea.md` §8, all except name and date of birth optional.
- Photo uploads: presigned upload, then server-side checks (real file type, size limit), **stripping EXIF/GPS metadata**, resized variants, and private-by-default storage.
- Profile editing, per-field visibility, and privacy preferences.
- **Done when:** IDOR tests prove member A can't read B's private photos or hidden fields, and every screen has its loading, empty and error states.

### 1.6 Verification foundation
- Choose the vendor (D2), connect it through `core/verification`, and receive results by signature-verified webhook.
- Store result, level, timestamp and vendor reference only. Retention job and badge display.
- **Done when:** a sandbox verification round-trips and no document image is stored on our side.

### 1.7 Admin foundation
- Separate app with staff-only auth and MFA. Role- and permission-based access, granted per module.
- Member lookup showing limited fields, account restrict/suspend, and **an audit log entry for every staff action**.
- **Done when:** permission tests prove a moderator can't reach billing or verification data unless granted.

### 1.8 Public website ✅ (2026-11-22)
- The 16 pages in `idea.md` §7.
- The homepage meets all 8 required messages. It uses real product previews only, with no fabricated testimonials, statistics or stock photos of real people.
- Privacy Policy, Terms and Community Guidelines are written as **drafts clearly marked for legal review**.
- **Done when:** Lighthouse accessibility ≥ 95 and every page is responsive down to 360 px.

### 1.9 Phase 1 close-out
- Run the completion checklist from `idea.md` §26.
- Update PROJECT_STATUS, TODO and CHANGELOG, and record decisions in ARCHITECTURE.

---

## 6. Later phases (outline, detailed at each phase start)

- **Phase 2, Discovery:**
  - Location stored only as a coarse cell (city or large grid area). Raw coordinates are never stored.
  - Postgres indexes for filters, cursor pagination, a nearby-discovery switch, likes, passes and mutual matches.
  - Recommendations explainable through rule-based scoring on stated interests and intentions. No ranking by appearance or popularity.
- **Phase 3, Dating and messaging:**
  - Relationship intentions (the 6 options), match management, unmatch, block, report.
  - Ably messaging with message requests, rate limits, read receipts and voice notes.
  - No end-to-end encryption claims.
- **Phase 4, Community:** feed, posts, comments, reactions, stories, polls, public/private/approval communities, and moderation queues with human review.
- **Phase 5, Events and business:** events with time zones and RSVPs, verified organisations and opportunities, payments (D1), subscriptions with regional pricing, and entitlements.
- **Phase 6, Global:**
  - Community map from aggregated counts, hiding any city below a minimum member threshold so small groups can't be singled out.
  - Expo mobile app, more languages, and selective AI that follows `idea.md` §19.

---

## 7. Privacy and compliance notes that shape the design now

- **Self-identifying as a person of short stature may count as health or disability data.** Kenya's Data Protection Act treats health status as sensitive personal data, as GDPR does. So that field is optional, behind explicit consent, stored separately from profiles, hidden by default, never used by staff tools without permission, and never inferred.
- Kenya's sensitive categories also include **biometric data, marital status and family details**. Liveness selfies, relationship intentions and "family member" identity all need the same care.
- A **privacy impact assessment** comes before launching verification, and again before any recommendation profiling (`idea.md` §22).
- **ODPC registration:** Kenya requires data controllers to register with the Office of the Data Protection Commissioner above certain thresholds. Confirm before launch whether this applies. Transfers of personal data outside Kenya need adequate safeguards, which matters because hosting will be outside Kenya.
- None of the above is legal advice. The legal pages and the DPIA need review by a qualified lawyer before launch.

---

## 8. Main risks

| Risk | Mitigation |
|------|------------|
| Fetishisation, harassment and scams aimed at the core community | Safety tooling (block, report, rate limits, message requests) ships with each feature, never later. Moderation categories from `idea.md` §16 go in from Phase 3. |
| Payment provider refuses "dating" merchants | Paddle already excludes it. Confirm Paystack/Stripe acceptance at onboarding, before building checkout. |
| M-PESA can't auto-renew | Entitlements support prepaid periods as well as recurring card plans. |
| Scope: 17 domains is a lot for one build | Strict phase gates. Nothing starts until the previous phase meets the §26 checklist. |
| Beta services (Neon Realtime, branching auth) | Use beta features only where failure is non-critical (previews, feeds). Messaging runs on Ably plus Postgres. |

---

## Sources (checked November 2026)

- Neon managed Better Auth: https://neon.com/docs/auth/about.md · https://neon.com/docs/auth/overview
- Neon backend GA and Realtime beta: https://neon.com/docs/changelog/2026-10-16 · https://neon.com/blog/neon-now-has-realtime
- Cloudflare R2 pricing: https://developers.cloudflare.com/r2/pricing/
- Ably vs Pusher (chat features): https://ably.com/compare/ably-vs-pusher
- Paystack Kenya channels and pricing: https://paystack.com/docs/v2/ke/payments · https://paystack.com/ke/pricing
- Paystack M-PESA recurring limitation: https://support.paystack.com/hc/en-us/articles/9741649633052-Pay-with-M-PESA
- Stripe "Extended network" listing: https://startupowl.com/setup/stripe-unsupported-countries
- Paddle AUP (dating prohibited): https://paddle.com/help/start/intro-to-paddle/what-am-i-not-allowed-to-sell-on-paddle
- Veriff for Dating: https://www.veriff.com/industry/communities/veriff-for-dating
- Smile ID coverage: https://www.mastercard.com/za/en/news-and-trends/stories/2025/digital-identity-africa-smile-id.html
- Resend vs Postmark: https://www.suprsend.com/post/resend-vs-postmark
- Inngest vs Trigger.dev: https://dev.to/whoffagents/inngest-vs-triggerdev-background-job-orchestration-for-ai-saas-in-2026-1lem
- Better Auth vs Clerk (mobile SDKs): https://itsourcecode.com/web-dev/better-auth-vs-clerk-vs-auth-js-2026-auth-libraries/
- Ofcom dating guidance (UK Online Safety Act): https://www.ofcom.org.uk/online-safety/illegal-and-harmful-content/dating-and-social-discovery-know-the-online-safety-risks-rules-and-how-to-comply
- Little People of America (US community size, chapters): https://lpa.memberclicks.net/request-information · https://lpa.memberclicks.net/about-lpa
- Paystack countries and international cards: https://chargebee.com/docs/payments/2.0/payment-gateways-and-configuration/paystack
- Nigeria NDPC registration (major importance): https://iapp.org/news/a/nigerias-dpa-moves-towards-improved-regulatory-enforcement
- US state age-verification landscape: https://mayerbrown.com/en/insights/publications/2026/08/childrens-privacy-mid-year-update-key-legislative-developments-and-emerging-trends-for-businesses
- Smile ID Kenya ID types: https://docs.usesmileid.com/general/supported-id-types
- Kenya Data Protection Act, sensitive data: https://www.clydeco.com/en/insights/2025/01/critical-update-for-healthcare-providers-in-kenya · https://www.odpc.go.ke/wp-content/uploads/2025/07/Data-Controllers-360-Degrees-Compliance-Requirements.-Z-Card.pdf
