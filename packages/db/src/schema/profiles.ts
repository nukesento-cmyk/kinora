import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  pgTable,
  smallint,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { authUser } from "./auth";
import { authUserId, countryCodeCheck, createdAt, emptyTextArray, updatedAt } from "./columns";
import {
  connectionIntention,
  memberIdentity,
  messagePermission,
  moderationStatus,
  photoVisibility,
  profileVisibility,
} from "./enums";

/**
 * Member profile. One per auth user, created with the account at registration.
 * Date of birth is kept for age eligibility and age display only; it is never shown itself.
 * Location is country plus optional free-text city: no coordinates are ever stored (idea.md §10).
 */
export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Deleting the auth user deletes the profile and, through it, every member table. */
    userId: authUserId()
      .notNull()
      .unique()
      .references(() => authUser.id, { onDelete: "cascade" }),
    displayName: varchar("display_name", { length: 50 }).notNull(),
    dateOfBirth: date("date_of_birth", { mode: "string" }).notNull(),
    bio: varchar("bio", { length: 1000 }),
    countryCode: varchar("country_code", { length: 2 }).notNull(),
    city: varchar("city", { length: 100 }),
    languages: text("languages").array().notNull().default(emptyTextArray),
    interests: text("interests").array().notNull().default(emptyTextArray),
    hobbies: text("hobbies").array().notNull().default(emptyTextArray),
    connectionIntentions: connectionIntention("connection_intentions")
      .array()
      .notNull()
      .default(sql`'{}'::connection_intention[]`),
    onboardingCompletedAt: timestamp("onboarding_completed_at", { withTimezone: true }),
    /** Set when the member requests deletion; a job hard-deletes after the grace period. */
    deletionRequestedAt: timestamp("deletion_requested_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    check("profiles_country_code_iso", countryCodeCheck("country_code")),
    check("profiles_display_name_not_blank", sql`length(trim(${t.displayName})) > 0`),
    check("profiles_dob_plausible", sql`${t.dateOfBirth} >= DATE '1900-01-01'`),
    check("profiles_languages_max", sql`cardinality(${t.languages}) <= 10`),
    check("profiles_interests_max", sql`cardinality(${t.interests}) <= 30`),
    check("profiles_hobbies_max", sql`cardinality(${t.hobbies}) <= 30`),
    index("profiles_country_idx").on(t.countryCode),
    index("profiles_deletion_requested_idx")
      .on(t.deletionRequestedAt)
      .where(sql`${t.deletionRequestedAt} IS NOT NULL`),
  ],
);

export const profilePhotos = pgTable(
  "profile_photos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    /** Random, unguessable object key in the private bucket. Never a public URL. */
    storageKey: text("storage_key").notNull().unique(),
    position: smallint("position").notNull(),
    visibility: photoVisibility("visibility").notNull().default("members"),
    moderationStatus: moderationStatus("moderation_status").notNull().default("pending"),
    contentType: varchar("content_type", { length: 32 }).notNull(),
    byteSize: integer("byte_size").notNull(),
    width: integer("width").notNull(),
    height: integer("height").notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    unique("profile_photos_profile_position_uq").on(t.profileId, t.position),
    check("profile_photos_position_range", sql`${t.position} BETWEEN 0 AND 8`),
    check(
      "profile_photos_content_type",
      sql`${t.contentType} IN ('image/jpeg', 'image/png', 'image/webp')`,
    ),
    check("profile_photos_byte_size", sql`${t.byteSize} > 0 AND ${t.byteSize} <= 10485760`),
    check("profile_photos_dimensions", sql`${t.width} > 0 AND ${t.height} > 0`),
  ],
);

/**
 * Voluntary self-identification. Kept apart from profiles because it may be
 * health/disability data (Kenya DPA, GDPR Art. 9): explicit consent is required,
 * it is private by default, and it is deleted with the profile.
 */
export const memberSelfIdentification = pgTable("member_self_identification", {
  profileId: uuid("profile_id")
    .primaryKey()
    .references(() => profiles.id, { onDelete: "cascade" }),
  identity: memberIdentity("identity").notNull(),
  showOnProfile: boolean("show_on_profile").notNull().default(false),
  consentGivenAt: timestamp("consent_given_at", { withTimezone: true }).notNull(),
  updatedAt: updatedAt(),
});

/** Privacy defaults are the most protective option (idea.md §16: privacy by design). */
export const privacySettings = pgTable("privacy_settings", {
  profileId: uuid("profile_id")
    .primaryKey()
    .references(() => profiles.id, { onDelete: "cascade" }),
  profileVisibility: profileVisibility("profile_visibility").notNull().default("members"),
  showAge: boolean("show_age").notNull().default(true),
  showCity: boolean("show_city").notNull().default(false),
  nearbyDiscoveryEnabled: boolean("nearby_discovery_enabled").notNull().default(false),
  allowMessagesFrom: messagePermission("allow_messages_from").notNull().default("matches_only"),
  updatedAt: updatedAt(),
});

export const discoveryPreferences = pgTable(
  "discovery_preferences",
  {
    profileId: uuid("profile_id")
      .primaryKey()
      .references(() => profiles.id, { onDelete: "cascade" }),
    minAge: smallint("min_age").notNull().default(18),
    maxAge: smallint("max_age").notNull().default(99),
    countryCodes: text("country_codes").array().notNull().default(emptyTextArray),
    languages: text("languages").array().notNull().default(emptyTextArray),
    intentions: connectionIntention("intentions")
      .array()
      .notNull()
      .default(sql`'{}'::connection_intention[]`),
    updatedAt: updatedAt(),
  },
  (t) => [
    check(
      "discovery_age_range",
      sql`${t.minAge} >= 18 AND ${t.maxAge} <= 120 AND ${t.minAge} <= ${t.maxAge}`,
    ),
  ],
);
