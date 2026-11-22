import { eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  auditLogs,
  authAccount,
  authSession,
  authUser,
  discoveryPreferences,
  memberSelfIdentification,
  privacySettings,
  profilePhotos,
  profiles,
  staffRoleAssignments,
  staffRolePermissions,
  staffRoles,
  verificationRequests,
  waitlistEntries,
} from "./schema";
import { createTestDatabase, testDatabaseUrl } from "./testing/database";

type TestDb = Awaited<ReturnType<typeof createTestDatabase>>;

/** Postgres error code from a failed query, unwrapping Drizzle's error wrapper. */
async function pgErrorCode(promise: Promise<unknown>): Promise<string | undefined> {
  try {
    await promise;
    return undefined;
  } catch (error) {
    const e = error as { code?: string; cause?: { code?: string } };
    return e.cause?.code ?? e.code;
  }
}

const CHECK_VIOLATION = "23514";
const UNIQUE_VIOLATION = "23505";
const FK_VIOLATION = "23503";
const INSUFFICIENT_PRIVILEGE = "42501";

const baseProfile = (n: number) => ({
  userId: `user_${n}`,
  displayName: `Member ${n}`,
  dateOfBirth: "1995-04-12",
  countryCode: "KE",
});

describe.skipIf(!testDatabaseUrl)("Phase 1 schema (integration)", () => {
  let t: TestDb;
  beforeAll(async () => {
    t = await createTestDatabase();
    // Profiles belong to auth users (foreign key since milestone 1.4).
    await t.db.insert(authUser).values(
      Array.from({ length: 60 }, (_, n) => ({
        id: `user_${n}`,
        name: `Member ${n}`,
        email: `member${n}@example.com`,
      })),
    );
  }, 60_000);
  afterAll(async () => {
    await t?.drop();
  });

  describe("profiles", () => {
    it("creates a profile with empty arrays and no coordinates column", async () => {
      const [p] = await t.db.insert(profiles).values(baseProfile(1)).returning();
      expect(p?.languages).toEqual([]);
      expect(p?.connectionIntentions).toEqual([]);
      const cols = await t.pool.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = 'profiles'`,
      );
      const names = cols.rows.map((r) => r.column_name as string);
      expect(names.some((n) => /lat|lng|lon|coord|geo/.test(n))).toBe(false);
    });

    it("allows one profile per auth user", async () => {
      await t.db.insert(profiles).values(baseProfile(2));
      expect(await pgErrorCode(t.db.insert(profiles).values(baseProfile(2)))).toBe(
        UNIQUE_VIOLATION,
      );
    });

    it("rejects non-ISO country codes and blank names", async () => {
      expect(
        await pgErrorCode(t.db.insert(profiles).values({ ...baseProfile(3), countryCode: "ke" })),
      ).toBe(CHECK_VIOLATION);
      expect(
        await pgErrorCode(t.db.insert(profiles).values({ ...baseProfile(4), displayName: "   " })),
      ).toBe(CHECK_VIOLATION);
    });
  });

  describe("photos", () => {
    it("enforces one photo per slot, allowed types and size limit", async () => {
      const [p] = await t.db.insert(profiles).values(baseProfile(10)).returning();
      const photo = {
        profileId: p!.id,
        storageKey: "k/10/a",
        position: 0,
        contentType: "image/jpeg",
        byteSize: 1000,
        width: 800,
        height: 800,
      };
      await t.db.insert(profilePhotos).values(photo);
      expect(
        await pgErrorCode(t.db.insert(profilePhotos).values({ ...photo, storageKey: "k/10/b" })),
      ).toBe(UNIQUE_VIOLATION);
      expect(
        await pgErrorCode(
          t.db
            .insert(profilePhotos)
            .values({ ...photo, storageKey: "k/10/c", position: 1, contentType: "image/svg+xml" }),
        ),
      ).toBe(CHECK_VIOLATION);
      expect(
        await pgErrorCode(
          t.db
            .insert(profilePhotos)
            .values({ ...photo, storageKey: "k/10/d", position: 2, byteSize: 20_000_000 }),
        ),
      ).toBe(CHECK_VIOLATION);
    });

    it("defaults new photos to pending moderation", async () => {
      const [p] = await t.db.insert(profiles).values(baseProfile(11)).returning();
      const [photo] = await t.db
        .insert(profilePhotos)
        .values({
          profileId: p!.id,
          storageKey: "k/11/a",
          position: 0,
          contentType: "image/webp",
          byteSize: 10,
          width: 1,
          height: 1,
        })
        .returning();
      expect(photo?.moderationStatus).toBe("pending");
    });
  });

  describe("privacy defaults", () => {
    it("starts with the most protective settings", async () => {
      const [p] = await t.db.insert(profiles).values(baseProfile(20)).returning();
      const [s] = await t.db.insert(privacySettings).values({ profileId: p!.id }).returning();
      expect(s).toMatchObject({
        showCity: false,
        nearbyDiscoveryEnabled: false,
        allowMessagesFrom: "matches_only",
      });
      const [id] = await t.db
        .insert(memberSelfIdentification)
        .values({ profileId: p!.id, identity: "ally", consentGivenAt: new Date() })
        .returning();
      expect(id?.showOnProfile).toBe(false);
    });

    it("requires recorded consent for self-identification", async () => {
      const [p] = await t.db.insert(profiles).values(baseProfile(21)).returning();
      const code = await pgErrorCode(
        t.pool.query(
          `INSERT INTO member_self_identification (profile_id, identity) VALUES ($1, 'ally')`,
          [p!.id],
        ),
      );
      expect(code).toBe("23502"); // not_null_violation
    });

    it("keeps discovery ages adult and ordered", async () => {
      const [p] = await t.db.insert(profiles).values(baseProfile(22)).returning();
      expect(
        await pgErrorCode(
          t.db.insert(discoveryPreferences).values({ profileId: p!.id, minAge: 17 }),
        ),
      ).toBe(CHECK_VIOLATION);
      expect(
        await pgErrorCode(
          t.db.insert(discoveryPreferences).values({ profileId: p!.id, minAge: 40, maxAge: 30 }),
        ),
      ).toBe(CHECK_VIOLATION);
    });
  });

  describe("verification", () => {
    it("requires a completion time exactly when no longer pending", async () => {
      const [p] = await t.db.insert(profiles).values(baseProfile(30)).returning();
      expect(
        await pgErrorCode(
          t.db.insert(verificationRequests).values({
            profileId: p!.id,
            provider: "smile_id",
            kind: "identity",
            status: "approved",
          }),
        ),
      ).toBe(CHECK_VIOLATION);
      await t.db.insert(verificationRequests).values({
        profileId: p!.id,
        provider: "smile_id",
        providerReference: "job-1",
        kind: "identity",
        status: "approved",
        completedAt: new Date(),
      });
    });

    it("has no columns for documents or ID numbers", async () => {
      const cols = await t.pool.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = 'verification_requests'`,
      );
      const names = cols.rows.map((r) => r.column_name as string);
      expect(names.some((n) => /document|image|photo|id_number|selfie|biometric/.test(n))).toBe(
        false,
      );
    });
  });

  describe("account deletion", () => {
    it("removes photos, self-identification, settings and verification with the profile", async () => {
      const [p] = await t.db.insert(profiles).values(baseProfile(40)).returning();
      const profileId = p!.id;
      await t.db.insert(privacySettings).values({ profileId });
      await t.db
        .insert(memberSelfIdentification)
        .values({ profileId, identity: "person_of_short_stature", consentGivenAt: new Date() });
      await t.db.insert(profilePhotos).values({
        profileId,
        storageKey: "k/40/a",
        position: 0,
        contentType: "image/png",
        byteSize: 5,
        width: 1,
        height: 1,
      });
      await t.db
        .insert(verificationRequests)
        .values({ profileId, provider: "smile_id", kind: "age" });

      await t.db.delete(profiles).where(eq(profiles.id, profileId));

      for (const table of [
        "privacy_settings",
        "member_self_identification",
        "profile_photos",
        "verification_requests",
      ]) {
        const r = await t.pool.query(
          `SELECT count(*)::int AS n FROM ${table} WHERE profile_id = $1`,
          [profileId],
        );
        expect(r.rows[0].n, table).toBe(0);
      }
    });
  });

  describe("auth tables", () => {
    it("rejects a profile for a user that doesn't exist", async () => {
      expect(
        await pgErrorCode(t.db.insert(profiles).values({ ...baseProfile(1), userId: "nobody" })),
      ).toBe(FK_VIOLATION);
    });

    it("keeps emails and session tokens unique and links sign-in methods once", async () => {
      expect(
        await pgErrorCode(
          t.db.insert(authUser).values({ id: "dup", name: "Dup", email: "member1@example.com" }),
        ),
      ).toBe(UNIQUE_VIOLATION);
      const session = {
        id: "s_a",
        token: "tok_a",
        userId: "user_50",
        expiresAt: new Date(Date.now() + 60_000),
      };
      await t.db.insert(authSession).values(session);
      expect(await pgErrorCode(t.db.insert(authSession).values({ ...session, id: "s_b" }))).toBe(
        UNIQUE_VIOLATION,
      );
      const account = {
        id: "a_a",
        accountId: "user_50",
        providerId: "credential",
        userId: "user_50",
      };
      await t.db.insert(authAccount).values(account);
      expect(await pgErrorCode(t.db.insert(authAccount).values({ ...account, id: "a_b" }))).toBe(
        UNIQUE_VIOLATION,
      );
    });

    it("stores rate-limit counters with millisecond timestamps", async () => {
      await t.pool.query(
        `INSERT INTO rate_limit (id, key, count, last_request) VALUES ('r1', '203.0.113.7|/sign-in/email', 1, $1)`,
        [Date.now()],
      );
      expect(
        await pgErrorCode(
          t.pool.query(
            `INSERT INTO rate_limit (id, key, count, last_request) VALUES ('r2', '203.0.113.7|/sign-in/email', 1, 0)`,
          ),
        ),
      ).toBe(UNIQUE_VIOLATION);
    });

    it("deleting a user removes sessions, sign-in methods, the profile and all its child rows", async () => {
      const userId = "user_cascade";
      await t.db
        .insert(authUser)
        .values({ id: userId, name: "Cascade", email: "cascade@example.com" });
      await t.db.insert(authSession).values({
        id: "s_cascade",
        token: "tok_cascade",
        userId,
        expiresAt: new Date(Date.now() + 60_000),
      });
      await t.db.insert(authAccount).values({
        id: "a_cascade",
        accountId: userId,
        providerId: "credential",
        userId,
        password: "hash",
      });
      const [p] = await t.db
        .insert(profiles)
        .values({ ...baseProfile(0), userId })
        .returning();
      const profileId = p!.id;
      await t.db.insert(privacySettings).values({ profileId });
      await t.db.insert(discoveryPreferences).values({ profileId });
      await t.db
        .insert(memberSelfIdentification)
        .values({ profileId, identity: "family_member", consentGivenAt: new Date() });
      await t.db.insert(profilePhotos).values({
        profileId,
        storageKey: "k/cascade/a",
        position: 0,
        contentType: "image/png",
        byteSize: 5,
        width: 1,
        height: 1,
      });
      await t.db
        .insert(verificationRequests)
        .values({ profileId, provider: "smile_id", kind: "age" });

      await t.db.delete(authUser).where(eq(authUser.id, userId));

      for (const [table, column, id] of [
        ["session", "user_id", userId],
        ["account", "user_id", userId],
        ["profiles", "user_id", userId],
        ["privacy_settings", "profile_id", profileId],
        ["discovery_preferences", "profile_id", profileId],
        ["member_self_identification", "profile_id", profileId],
        ["profile_photos", "profile_id", profileId],
        ["verification_requests", "profile_id", profileId],
      ] as const) {
        const r = await t.pool.query(
          `SELECT count(*)::int AS n FROM ${table} WHERE ${column} = $1`,
          [id],
        );
        expect(r.rows[0].n, table).toBe(0);
      }
    });
  });

  describe("waitlist", () => {
    it("holds one entry per email, stored lower case, with an ISO country", async () => {
      await t.db.insert(waitlistEntries).values({ email: "wait@example.com", countryCode: "NG" });
      expect(
        await pgErrorCode(
          t.db.insert(waitlistEntries).values({ email: "wait@example.com", countryCode: "GH" }),
        ),
      ).toBe(UNIQUE_VIOLATION);
      expect(
        await pgErrorCode(
          t.db.insert(waitlistEntries).values({ email: "Wait@Example.com", countryCode: "GH" }),
        ),
      ).toBe(CHECK_VIOLATION);
      expect(
        await pgErrorCode(
          t.db.insert(waitlistEntries).values({ email: "other@example.com", countryCode: "ng" }),
        ),
      ).toBe(CHECK_VIOLATION);
    });
  });

  describe("staff access", () => {
    it("validates permission names and blocks self-granted roles", async () => {
      const [role] = await t.db
        .insert(staffRoles)
        .values({ key: "moderator", name: "Moderator" })
        .returning();
      await t.db
        .insert(staffRolePermissions)
        .values({ roleId: role!.id, permission: "reports.review" });
      expect(
        await pgErrorCode(
          t.db.insert(staffRolePermissions).values({ roleId: role!.id, permission: "everything" }),
        ),
      ).toBe(CHECK_VIOLATION);
      expect(
        await pgErrorCode(
          t.db
            .insert(staffRoleAssignments)
            .values({ staffUserId: "staff_1", roleId: role!.id, grantedBy: "staff_1" }),
        ),
      ).toBe(CHECK_VIOLATION);
    });

    it("won't delete a role that is still assigned", async () => {
      const [role] = await t.db
        .insert(staffRoles)
        .values({ key: "support", name: "Support" })
        .returning();
      await t.db
        .insert(staffRoleAssignments)
        .values({ staffUserId: "staff_2", roleId: role!.id, grantedBy: "staff_admin" });
      expect(await pgErrorCode(t.db.delete(staffRoles).where(eq(staffRoles.id, role!.id)))).toBe(
        FK_VIOLATION,
      );
    });
  });

  describe("audit log", () => {
    it("accepts new entries", async () => {
      await t.db.insert(auditLogs).values({
        actorType: "staff",
        actorId: "staff_1",
        action: "member.suspend",
        targetType: "profile",
        targetId: "p1",
        metadata: { reason: "spam" },
      });
    });

    it("rejects updates, deletes and truncation", async () => {
      expect(await pgErrorCode(t.db.update(auditLogs).set({ action: "member.restore" }))).toBe(
        INSUFFICIENT_PRIVILEGE,
      );
      expect(await pgErrorCode(t.db.delete(auditLogs))).toBe(INSUFFICIENT_PRIVILEGE);
      expect(await pgErrorCode(t.db.execute(sql`TRUNCATE audit_logs`))).toBe(
        INSUFFICIENT_PRIVILEGE,
      );
    });

    it("requires an actor for staff and member actions", async () => {
      expect(
        await pgErrorCode(
          t.db.insert(auditLogs).values({ actorType: "staff", action: "member.view" }),
        ),
      ).toBe(CHECK_VIOLATION);
    });
  });
});
