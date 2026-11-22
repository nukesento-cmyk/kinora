import { sql } from "drizzle-orm";
import { check, index, pgTable, timestamp, unique, uuid, varchar } from "drizzle-orm/pg-core";
import { verificationKind, verificationStatus } from "./enums";
import { profiles } from "./profiles";

/**
 * Verification requests sent to the vendor (Smile ID planned).
 * KINORA stores only the outcome and the vendor's reference: never document
 * images, ID numbers or biometric templates (idea.md §16, data minimisation).
 */
export const verificationRequests = pgTable(
  "verification_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    provider: varchar("provider", { length: 32 }).notNull(),
    providerReference: varchar("provider_reference", { length: 128 }),
    kind: verificationKind("kind").notNull(),
    status: verificationStatus("status").notNull().default("pending"),
    requestedAt: timestamp("requested_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    /** Badge validity; the retention job expires results after this. */
    expiresAt: timestamp("expires_at", { withTimezone: true }),
  },
  (t) => [
    unique("verification_provider_reference_uq").on(t.provider, t.providerReference),
    index("verification_profile_idx").on(t.profileId, t.kind),
    check(
      "verification_completed_has_time",
      sql`(${t.status} = 'pending') = (${t.completedAt} IS NULL)`,
    ),
  ],
);
