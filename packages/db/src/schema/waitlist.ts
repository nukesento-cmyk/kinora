import { sql } from "drizzle-orm";
import { check, pgTable, uuid, varchar } from "drizzle-orm/pg-core";
import { countryCodeCheck, createdAt } from "./columns";

/**
 * People who tried to register from a country that isn't open yet (LAUNCH_MARKETS).
 * Holds only what's needed to tell them when it opens: email and country.
 * Emails are stored lower case so uniqueness is case-insensitive.
 */
export const waitlistEntries = pgTable(
  "waitlist_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 254 }).notNull().unique(),
    countryCode: varchar("country_code", { length: 2 }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    check("waitlist_country_code_iso", countryCodeCheck("country_code")),
    check("waitlist_email_lower", sql`${t.email} = lower(${t.email})`),
  ],
);
