import {
  bigint,
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

/**
 * Better Auth tables (self-hosted, milestone 1.4). Property names are the field names
 * Better Auth expects; columns are snake_case like the rest of the schema.
 * Better Auth checks this schema against the database at runtime, so a mismatch
 * fails loudly instead of corrupting data.
 *
 * Secrets: account.password holds a scrypt hash, never a password. OAuth tokens are
 * stored only for linked providers. Neither is ever returned by a data export.
 */
const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

export const authUser = pgTable("user", {
  id: text("id").primaryKey(),
  /** Display name chosen at registration. Mirrors profiles.display_name. */
  name: text("name").notNull(),
  /** Always stored lower case by Better Auth. */
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  ...timestamps,
});

export const authSession = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    /** Opaque random token. The cookie holds it signed; it never appears in pages or exports. */
    token: text("token").notNull().unique(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => authUser.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (t) => [index("session_user_id_idx").on(t.userId)],
);

export const authAccount = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    /** "credential" for email + password, otherwise the OAuth provider (e.g. "google"). */
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => authUser.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    ...timestamps,
  },
  (t) => [
    index("account_user_id_idx").on(t.userId),
    unique("account_provider_account_uq").on(t.providerId, t.accountId),
  ],
);

/** Short-lived tokens (password reset and similar). Rows expire; they hold no personal data beyond an identifier. */
export const authVerification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ...timestamps,
  },
  (t) => [index("verification_identifier_idx").on(t.identifier)],
);

/** Rate-limit counters, keyed by client IP and auth path. Shared by every app instance. */
export const authRateLimit = pgTable("rate_limit", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  count: integer("count").notNull(),
  /** Milliseconds since the epoch, as Better Auth stores it. */
  lastRequest: bigint("last_request", { mode: "number" }).notNull(),
});
