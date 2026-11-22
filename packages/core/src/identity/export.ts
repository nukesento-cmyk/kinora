import type { schema } from "@kinora/db";

type Row<T extends { $inferSelect: unknown }> = T["$inferSelect"];

/** Everything stored about one member, as read from the database. */
export interface MemberDataRows {
  user: Row<typeof schema.authUser>;
  accounts: Row<typeof schema.authAccount>[];
  sessions: Row<typeof schema.authSession>[];
  profile: Row<typeof schema.profiles> | null;
  photos: Row<typeof schema.profilePhotos>[];
  selfIdentification: Row<typeof schema.memberSelfIdentification> | null;
  privacySettings: Row<typeof schema.privacySettings> | null;
  discoveryPreferences: Row<typeof schema.discoveryPreferences> | null;
  verificationRequests: Row<typeof schema.verificationRequests>[];
}

const iso = (d: Date | null | undefined) => (d ? d.toISOString() : null);

export const EXPORT_FORMAT_VERSION = 1;

/**
 * Shape a member's own data for download (right of access, GDPR Art. 15 / Kenya DPA s.26).
 * Fields are listed explicitly, so a new secret column can never leak into an export
 * by accident. Never included: password hashes, OAuth and session tokens, internal
 * storage keys of photos.
 */
export function buildMemberExport(rows: MemberDataRows, exportedAt: Date) {
  const { user, profile } = rows;
  return {
    format: "kinora-member-export",
    version: EXPORT_FORMAT_VERSION,
    exportedAt: exportedAt.toISOString(),
    account: {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      image: user.image,
      createdAt: iso(user.createdAt),
      updatedAt: iso(user.updatedAt),
      signInMethods: rows.accounts.map((a) => ({
        provider: a.providerId,
        linkedAt: iso(a.createdAt),
      })),
      sessions: rows.sessions.map((s) => ({
        createdAt: iso(s.createdAt),
        lastActiveAt: iso(s.updatedAt),
        expiresAt: iso(s.expiresAt),
        ipAddress: s.ipAddress,
        userAgent: s.userAgent,
      })),
    },
    profile: profile
      ? {
          id: profile.id,
          displayName: profile.displayName,
          dateOfBirth: profile.dateOfBirth,
          countryCode: profile.countryCode,
          city: profile.city,
          bio: profile.bio,
          languages: profile.languages,
          interests: profile.interests,
          hobbies: profile.hobbies,
          connectionIntentions: profile.connectionIntentions,
          onboardingCompletedAt: iso(profile.onboardingCompletedAt),
          deletionRequestedAt: iso(profile.deletionRequestedAt),
          createdAt: iso(profile.createdAt),
          updatedAt: iso(profile.updatedAt),
        }
      : null,
    photos: rows.photos.map((p) => ({
      id: p.id,
      position: p.position,
      visibility: p.visibility,
      moderationStatus: p.moderationStatus,
      contentType: p.contentType,
      byteSize: p.byteSize,
      width: p.width,
      height: p.height,
      createdAt: iso(p.createdAt),
    })),
    selfIdentification: rows.selfIdentification
      ? {
          identity: rows.selfIdentification.identity,
          showOnProfile: rows.selfIdentification.showOnProfile,
          consentGivenAt: iso(rows.selfIdentification.consentGivenAt),
          updatedAt: iso(rows.selfIdentification.updatedAt),
        }
      : null,
    privacySettings: rows.privacySettings
      ? {
          profileVisibility: rows.privacySettings.profileVisibility,
          showAge: rows.privacySettings.showAge,
          showCity: rows.privacySettings.showCity,
          nearbyDiscoveryEnabled: rows.privacySettings.nearbyDiscoveryEnabled,
          allowMessagesFrom: rows.privacySettings.allowMessagesFrom,
          updatedAt: iso(rows.privacySettings.updatedAt),
        }
      : null,
    discoveryPreferences: rows.discoveryPreferences
      ? {
          minAge: rows.discoveryPreferences.minAge,
          maxAge: rows.discoveryPreferences.maxAge,
          countryCodes: rows.discoveryPreferences.countryCodes,
          languages: rows.discoveryPreferences.languages,
          intentions: rows.discoveryPreferences.intentions,
          updatedAt: iso(rows.discoveryPreferences.updatedAt),
        }
      : null,
    verifications: rows.verificationRequests.map((v) => ({
      id: v.id,
      provider: v.provider,
      providerReference: v.providerReference,
      kind: v.kind,
      status: v.status,
      requestedAt: iso(v.requestedAt),
      completedAt: iso(v.completedAt),
      expiresAt: iso(v.expiresAt),
    })),
  };
}

export type MemberExport = ReturnType<typeof buildMemberExport>;
