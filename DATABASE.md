# Database

_PostgreSQL via Drizzle ORM. Describes the schema as it exists in `packages/db/migrations`._

## Environments

| Environment | Where | How |
|-------------|-------|-----|
| Local development | Docker on your machine, port 5433 | `pnpm db:up` then `pnpm db:migrate` |
| Tests | Throwaway databases on the server in `TEST_DATABASE_URL` | Created and dropped per test file |
| CI | Postgres 18 service container | Fresh database every run |
| Hosted (later) | Neon (create through Vercel Storage, since your Neon org is Vercel-managed) | Same migrations, pooled URL with `?sslmode=require` |

The client (`createDb()` in `@kinora/db`) uses node-postgres, which works with all of these. Neon's HTTP driver was dropped because it can't reach a local database.

## Workflow

```bash
pnpm db:up          # start local Postgres (Docker)
pnpm db:migrate     # apply migrations to DATABASE_URL
# edit packages/db/src/schema/*.ts, then:
pnpm db:generate    # write a new SQL migration — commit it
pnpm db:check       # verify migration history is consistent
```

`pnpm db:migrate` runs our own runner (`packages/db/src/migrate.ts`), not `drizzle-kit migrate`, which exits without showing the cause when it can't connect or log in. The runner waits up to 20 seconds for a database that's still starting, then explains any failure:

| Message starts with | Meaning | Fix |
|---------------------|---------|-----|
| "Nothing is accepting connections" | Database not running | Start Docker, then `pnpm db:up`. Check with `docker compose ps` |
| "user … doesn't exist there" | Another Postgres is on port 5433 | Stop it, or change the port in `docker-compose.yml` and `.env` |
| "rejected the password" | Password doesn't match the Docker volume | `pnpm db:down && docker volume rm kinora_kinora-db && pnpm db:up` |
| "that database doesn't exist" | Wrong database name in `DATABASE_URL` | Use `/kinora` |

Rules: every schema change ships as a committed migration (`idea.md` §2.11). CI fails if the schema and migrations drift apart. Migrations never silently drop data. Destructive changes need an explicit, reviewed migration.

## Migrations

| # | File | What it does |
|---|------|--------------|
| 0000 | `0000_init.sql` | Phase 1 enums and 10 tables (below) |
| 0001 | `0001_audit_logs_append_only.sql` | Triggers that reject UPDATE, DELETE and TRUNCATE on `audit_logs` |
| 0002 | `0002_auth.sql` | Better Auth tables (`user`, `session`, `account`, `verification`, rate-limit storage), FK `profiles.user_id → user.id ON DELETE CASCADE`, and `waitlist_entries` |

## Tables

### Members
| Table | Purpose | Key rules |
|-------|---------|-----------|
| `profiles` | One per auth user | `user_id` unique. ISO-2 `country_code` (upper case). Optional free-text `city` and **no coordinate columns** (test-enforced). Arrays capped (10 languages, 30 interests, 30 hobbies). `deletion_requested_at` marks the deletion grace period |
| `profile_photos` | Up to 9 photos per profile | Unique `(profile_id, position)`, positions 0–8. JPEG/PNG/WebP only. ≤ 10 MB. Random `storage_key` in a private bucket, never a public URL. Moderation starts `pending` |
| `member_self_identification` | Voluntary identity: person of short stature, interested member, family member, ally, prefer not to say | **Sensitive.** Separate table. `consent_given_at` required. `show_on_profile` defaults to false |
| `privacy_settings` | Per-member privacy | Defaults are the most protective: city hidden, nearby discovery off, messages from matches only |
| `discovery_preferences` | Who a member wants to discover | Age range 18–120 and min ≤ max |

### Verification
| Table | Purpose | Key rules |
|-------|---------|-----------|
| `verification_requests` | Outcome of vendor checks (identity, age, liveness) | Stores status and vendor reference only. **No columns for documents, images or ID numbers** (test-enforced). `completed_at` is set exactly when status isn't `pending`. Unique `(provider, provider_reference)` |

### Staff access
| Table | Purpose | Key rules |
|-------|---------|-----------|
| `staff_roles` | Named roles (e.g. `moderator`) | `key` is lower_snake_case |
| `staff_role_permissions` | Permissions granted to a role | Format `module.action` (e.g. `reports.review`). No wildcards |
| `staff_role_assignments` | Which staff account has which role | Nobody can grant a role to themselves. A role still assigned can't be deleted |

### Audit
| Table | Purpose | Key rules |
|-------|---------|-----------|
| `audit_logs` | Every sensitive action | **Append-only** by trigger. Action format `module.verb`. Staff and member entries need an actor. Indexed by actor, target and time. Metadata must never hold message bodies, documents or passwords |

### Authentication (Better Auth, milestone 1.4)
| Table | Purpose | Key rules |
|-------|---------|-----------|
| `user`, `session`, `account`, `verification` | Accounts, sessions, linked sign-in methods, email and reset tokens | Managed by Better Auth through our Drizzle schema (`schema/auth.ts`). Deleting a user cascades to the profile and all of the member's data |
| rate-limit table | Better Auth rate-limit counters | Stored in Postgres so limits hold across server instances |
| `waitlist_entries` | People from countries where registration isn't open yet | Email unique. ISO-2 country check |

### Deletion behaviour
Deleting a profile cascades to its photos, self-identification, privacy settings, discovery preferences and verification requests (test-enforced). Audit entries are kept. After the grace period (`ACCOUNT_DELETION_GRACE_DAYS`, default 30), `pnpm jobs:purge-deleted` hard-deletes the user, each in its own transaction, and writes a `system` audit entry. Signing in during the grace period cancels the deletion.

## Not yet in the schema
- Everything from later phases (matches, messages, communities, events, payments) is added in its own phase.
