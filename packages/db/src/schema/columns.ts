import { sql } from "drizzle-orm";
import { text, timestamp } from "drizzle-orm/pg-core";

/**
 * Better Auth user id, stored as text. Member tables add a foreign key to the
 * auth user table (see profiles). Staff tables don't yet: staff accounts get their
 * own sign-in with MFA in milestone 1.7.
 */
export const authUserId = (name = "user_id") => text(name);

export const createdAt = () =>
  timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

export const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

export const emptyTextArray = sql`'{}'::text[]`;

/** ISO 3166-1 alpha-2, upper case. */
export const countryCodeCheck = (column: string) => sql.raw(`${column} ~ '^[A-Z]{2}$'`);
