# Security

_Lists controls that are actually in place. Planned controls are in `IMPLEMENTATION_PLAN.md`._

## In place (milestone 1.1)

- **Configuration:** all env vars are Zod-validated at startup. Validation errors list variable names only, never values (covered by a unit test). `.env*` files are git-ignored except `.env.example`, which holds no secrets.
- **HTTP headers on every route of both apps:** HSTS, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, CSP `frame-ancestors 'none'; base-uri 'self'; object-src 'none'`, strict referrer policy, and a `Permissions-Policy` that disables geolocation, camera, microphone and payment APIs. The `X-Powered-By` header is removed. Checked by e2e tests.
- **Staff app:** separate deployment, `noindex` header and metadata, and no data or actions until staff auth with MFA lands (milestone 1.7).
- **Health endpoints** return only `{status, service}`, with no versions, env or dependency details.
- **CI** runs with read-only repository permissions.

## In place (milestone 1.2: database)

- **Audit log is append-only:** database triggers reject UPDATE, DELETE and TRUNCATE (integration-tested).
- **Data minimisation in the schema:** no coordinate columns on profiles, and no document, image or ID-number columns on verification records. Both are integration-tested so they can't creep back in.
- **Sensitive self-identification** sits in its own table, can't be saved without a consent timestamp, and is hidden by default.
- **Protective privacy defaults:** city hidden, nearby discovery off, messages from matches only.
- **Staff access:** permissions are explicit `module.action` strings with no wildcards. Self-granting roles is blocked by a database constraint.
- **Deletion:** removing a profile cascades to all of the member's personal data tables.

## In place (milestone 1.3)

- The `/design` review page returns 404 unless `ENABLE_DESIGN_PREVIEW` is exactly `true` (unit-tested), and it's never indexed.
- Fonts are self-hosted, so members' browsers make no requests to Google.

## In place (milestone 1.4: authentication)

- **Better Auth, self-hosted**, with users and sessions in our Postgres. Session cookies are httpOnly and SameSite=Lax, and Secure in production (unit-tested).
- **One gate for sign-up:** a server-side hook enforces 18+ (from date of birth, in UTC) and launch markets on every sign-up path. Google can only sign in to existing accounts.
- **No account enumeration:**
  - Login failures give one generic message, and forgot-password always says "if an account exists".
  - Signing up with an existing email looks like success; the owner gets an email about it.
  - Emails are sent after the response, so timing gives nothing away.
- **Rate limiting** (database-backed) and **CSRF/origin checks** apply to the forms too, because server actions go through Better Auth's HTTP router. E2E-tested on repeated failed sign-ins.
- **Email verification** before sign-in completes. Confirming takes a button press, so mail scanners can't confirm addresses.
- **Content-Security-Policy with a per-request nonce** (`proxy.ts`) on the member app. The staff app has a nonce-less policy until it gets interactive features.
- **Deletion:** a request revokes all sessions and hides the profile. The purge job writes a system audit entry per account. **Export** returns only the signed-in member's own data (e2e-tested).
- **Boot checks:** production refuses to start without `RESEND_API_KEY`/`EMAIL_FROM` or with `DEV_MAILBOX=true`. `BETTER_AUTH_SECRET` must be at least 32 characters.
- **Known limits:**
  - Rate limits key on `x-forwarded-for`. That's safe on Vercel; any other proxy in front must overwrite the header.
  - Google sign-in hasn't been tested against Google itself.

## Not yet in place

Upload validation and EXIF stripping (1.5), writing audit entries from staff actions (1.7; the table exists), a separate least-privilege database role for the app (with the move to Neon), and dependency vulnerability scanning in CI.

## Reporting a vulnerability

A security contact will be published once the support address is configured (`NEXT_PUBLIC_SUPPORT_EMAIL`).
