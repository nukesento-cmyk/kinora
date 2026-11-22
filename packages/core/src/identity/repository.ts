import { schema, type Database } from "@kinora/db";
import { and, asc, desc, eq, gt, isNotNull, lte, ne } from "drizzle-orm";
import type { CountryCode } from "../markets";
import { purgeCutoff } from "./deletion";
import type { MemberDataRows } from "./export";

const {
  auditLogs,
  authAccount,
  authSession,
  authUser,
  authVerification,
  discoveryPreferences,
  memberSelfIdentification,
  privacySettings,
  profilePhotos,
  profiles,
  verificationRequests,
  waitlistEntries,
} = schema;

/** Create the member profile that goes with a new account (called from the sign-up hook). */
export async function createMemberProfile(
  db: Database,
  input: { userId: string; displayName: string; dateOfBirth: string; countryCode: CountryCode },
): Promise<void> {
  await db.insert(profiles).values({
    userId: input.userId,
    displayName: input.displayName,
    dateOfBirth: input.dateOfBirth,
    countryCode: input.countryCode,
  });
}

/** Remove an account and, by cascade, everything that belongs to it. */
export async function deleteAccount(db: Database, userId: string): Promise<void> {
  await db.delete(authUser).where(eq(authUser.id, userId));
}

/**
 * Add someone to the waitlist for a country that isn't open yet.
 * Repeating it is harmless and indistinguishable from the first time,
 * so the form can't be used to find out who's on the list.
 */
export async function joinWaitlist(
  db: Database,
  input: { email: string; countryCode: CountryCode },
): Promise<void> {
  await db
    .insert(waitlistEntries)
    .values({ email: input.email.trim().toLowerCase(), countryCode: input.countryCode })
    .onConflictDoNothing({ target: waitlistEntries.email });
}

export type DeletionRequestResult =
  { status: "requested"; requestedAt: Date } | { status: "no_profile" };

/**
 * Start the deletion grace period: mark the profile and revoke every session at once,
 * in one transaction, and record it in the audit log. Asking twice keeps the first date.
 */
export async function requestAccountDeletion(
  db: Database,
  userId: string,
  now: Date,
): Promise<DeletionRequestResult> {
  return db.transaction(async (tx) => {
    const [profile] = await tx
      .select({ id: profiles.id, requestedAt: profiles.deletionRequestedAt })
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .for("update");
    if (!profile) return { status: "no_profile" } as const;
    const requestedAt = profile.requestedAt ?? now;
    if (!profile.requestedAt) {
      await tx
        .update(profiles)
        .set({ deletionRequestedAt: now })
        .where(eq(profiles.id, profile.id));
      await tx.insert(auditLogs).values({
        actorType: "member",
        actorId: userId,
        action: "account.deletion_request",
        targetType: "user",
        targetId: userId,
      });
    }
    await tx.delete(authSession).where(eq(authSession.userId, userId));
    return { status: "requested", requestedAt } as const;
  });
}

/** Signing in during the grace period keeps the account. Returns true if a request was cancelled. */
export async function cancelAccountDeletion(db: Database, userId: string): Promise<boolean> {
  return db.transaction(async (tx) => {
    const cancelled = await tx
      .update(profiles)
      .set({ deletionRequestedAt: null })
      .where(and(eq(profiles.userId, userId), isNotNull(profiles.deletionRequestedAt)))
      .returning({ id: profiles.id });
    if (cancelled.length === 0) return false;
    await tx.insert(auditLogs).values({
      actorType: "member",
      actorId: userId,
      action: "account.deletion_cancel",
      targetType: "user",
      targetId: userId,
    });
    return true;
  });
}

/** When the member asked for deletion, or null. */
export async function getDeletionRequest(db: Database, userId: string): Promise<Date | null> {
  const [row] = await db
    .select({ requestedAt: profiles.deletionRequestedAt })
    .from(profiles)
    .where(eq(profiles.userId, userId));
  return row?.requestedAt ?? null;
}

/**
 * Hard-delete every account whose grace period has ended. Each account is removed in
 * its own transaction together with a system audit entry, after re-checking that the
 * request still stands (the member may have signed in and cancelled meanwhile).
 * The audit entry holds ids and dates only, no personal data.
 */
export async function purgeDeletedAccounts(
  db: Database,
  { now, graceDays, limit = 500 }: { now: Date; graceDays: number; limit?: number },
): Promise<{ purged: string[] }> {
  const cutoff = purgeCutoff(now, graceDays);
  const due = await db
    .select({ userId: profiles.userId })
    .from(profiles)
    .where(and(isNotNull(profiles.deletionRequestedAt), lte(profiles.deletionRequestedAt, cutoff)))
    .orderBy(asc(profiles.deletionRequestedAt))
    .limit(limit);

  const purged: string[] = [];
  for (const { userId } of due) {
    const done = await db.transaction(async (tx) => {
      const [still] = await tx
        .select({ requestedAt: profiles.deletionRequestedAt })
        .from(profiles)
        .where(
          and(
            eq(profiles.userId, userId),
            isNotNull(profiles.deletionRequestedAt),
            lte(profiles.deletionRequestedAt, cutoff),
          ),
        )
        .for("update");
      if (!still?.requestedAt) return false;
      await tx.insert(auditLogs).values({
        actorType: "system",
        action: "account.purge",
        targetType: "user",
        targetId: userId,
        metadata: { deletionRequestedAt: still.requestedAt.toISOString(), graceDays },
      });
      // Password-reset tokens reference the user id in `value`.
      await tx.delete(authVerification).where(eq(authVerification.value, userId));
      await tx.delete(authUser).where(eq(authUser.id, userId));
      return true;
    });
    if (done) purged.push(userId);
  }
  return { purged };
}

/** Read every row that belongs to one member, and nothing that belongs to anyone else. */
export async function collectMemberData(
  db: Database,
  userId: string,
): Promise<MemberDataRows | null> {
  const [user] = await db.select().from(authUser).where(eq(authUser.id, userId));
  if (!user) return null;
  const [accounts, sessions, [profile]] = await Promise.all([
    db.select().from(authAccount).where(eq(authAccount.userId, userId)),
    db
      .select()
      .from(authSession)
      .where(eq(authSession.userId, userId))
      .orderBy(asc(authSession.createdAt)),
    db.select().from(profiles).where(eq(profiles.userId, userId)),
  ]);
  if (!profile) {
    return {
      user,
      accounts,
      sessions,
      profile: null,
      photos: [],
      selfIdentification: null,
      privacySettings: null,
      discoveryPreferences: null,
      verificationRequests: [],
    };
  }
  const [photos, [selfIdentification], [privacy], [discovery], verifications] = await Promise.all([
    db
      .select()
      .from(profilePhotos)
      .where(eq(profilePhotos.profileId, profile.id))
      .orderBy(asc(profilePhotos.position)),
    db
      .select()
      .from(memberSelfIdentification)
      .where(eq(memberSelfIdentification.profileId, profile.id)),
    db.select().from(privacySettings).where(eq(privacySettings.profileId, profile.id)),
    db.select().from(discoveryPreferences).where(eq(discoveryPreferences.profileId, profile.id)),
    db
      .select()
      .from(verificationRequests)
      .where(eq(verificationRequests.profileId, profile.id))
      .orderBy(asc(verificationRequests.requestedAt)),
  ]);
  return {
    user,
    accounts,
    sessions,
    profile,
    photos,
    selfIdentification: selfIdentification ?? null,
    privacySettings: privacy ?? null,
    discoveryPreferences: discovery ?? null,
    verificationRequests: verifications,
  };
}

/** Audit trail for a member downloading their own data. */
export async function recordDataExport(db: Database, userId: string): Promise<void> {
  await db.insert(auditLogs).values({
    actorType: "member",
    actorId: userId,
    action: "account.export",
    targetType: "user",
    targetId: userId,
  });
}

export interface ActiveSession {
  id: string;
  createdAt: Date;
  lastActiveAt: Date;
  expiresAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
}

/** The member's unexpired sessions, most recently active first. Tokens are never returned. */
export async function listActiveSessions(
  db: Database,
  userId: string,
  now: Date,
): Promise<ActiveSession[]> {
  return db
    .select({
      id: authSession.id,
      createdAt: authSession.createdAt,
      lastActiveAt: authSession.updatedAt,
      expiresAt: authSession.expiresAt,
      ipAddress: authSession.ipAddress,
      userAgent: authSession.userAgent,
    })
    .from(authSession)
    .where(and(eq(authSession.userId, userId), gt(authSession.expiresAt, now)))
    .orderBy(desc(authSession.updatedAt));
}

/**
 * Sign out one of the member's other sessions. Matches on both the session id and the
 * member's own user id, so nobody can end someone else's session by guessing an id.
 */
export async function revokeOtherSession(
  db: Database,
  input: { userId: string; sessionId: string; currentSessionId: string },
): Promise<boolean> {
  const deleted = await db
    .delete(authSession)
    .where(
      and(
        eq(authSession.id, input.sessionId),
        eq(authSession.userId, input.userId),
        ne(authSession.id, input.currentSessionId),
      ),
    )
    .returning({ id: authSession.id });
  return deleted.length > 0;
}
