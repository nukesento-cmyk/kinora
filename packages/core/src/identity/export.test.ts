import { describe, expect, it } from "vitest";
import { buildMemberExport, type MemberDataRows } from "./export";

const t = new Date("2026-11-01T08:00:00Z");

const rows: MemberDataRows = {
  user: {
    id: "u1",
    name: "Amani",
    email: "amani@example.com",
    emailVerified: true,
    image: null,
    createdAt: t,
    updatedAt: t,
  },
  accounts: [
    {
      id: "a1",
      accountId: "u1",
      providerId: "credential",
      userId: "u1",
      accessToken: "SECRET-ACCESS",
      refreshToken: "SECRET-REFRESH",
      idToken: "SECRET-ID",
      accessTokenExpiresAt: null,
      refreshTokenExpiresAt: null,
      scope: null,
      password: "scrypt:SECRET-HASH",
      createdAt: t,
      updatedAt: t,
    },
  ],
  sessions: [
    {
      id: "s1",
      token: "SECRET-SESSION-TOKEN",
      expiresAt: t,
      ipAddress: "203.0.113.7",
      userAgent: "Mozilla/5.0",
      userId: "u1",
      createdAt: t,
      updatedAt: t,
    },
  ],
  profile: {
    id: "p1",
    userId: "u1",
    displayName: "Amani",
    dateOfBirth: "1995-03-07",
    bio: null,
    countryCode: "KE",
    city: "Nairobi",
    languages: ["en", "sw"],
    interests: [],
    hobbies: [],
    connectionIntentions: ["friendship"],
    onboardingCompletedAt: null,
    deletionRequestedAt: null,
    createdAt: t,
    updatedAt: t,
  },
  photos: [
    {
      id: "ph1",
      profileId: "p1",
      storageKey: "SECRET-STORAGE-KEY",
      position: 0,
      visibility: "members",
      moderationStatus: "approved",
      contentType: "image/jpeg",
      byteSize: 1000,
      width: 800,
      height: 800,
      createdAt: t,
    },
  ],
  selfIdentification: {
    profileId: "p1",
    identity: "person_of_short_stature",
    showOnProfile: false,
    consentGivenAt: t,
    updatedAt: t,
  },
  privacySettings: {
    profileId: "p1",
    profileVisibility: "members",
    showAge: true,
    showCity: false,
    nearbyDiscoveryEnabled: false,
    allowMessagesFrom: "matches_only",
    updatedAt: t,
  },
  discoveryPreferences: {
    profileId: "p1",
    minAge: 25,
    maxAge: 40,
    countryCodes: ["KE"],
    languages: [],
    intentions: [],
    updatedAt: t,
  },
  verificationRequests: [
    {
      id: "v1",
      profileId: "p1",
      provider: "smile_id",
      providerReference: "job-1",
      kind: "age",
      status: "approved",
      requestedAt: t,
      completedAt: t,
      expiresAt: null,
    },
  ],
};

describe("buildMemberExport", () => {
  const exported = buildMemberExport(rows, new Date("2026-11-21T10:00:00Z"));
  const json = JSON.stringify(exported);

  it("contains every category of the member's own data", () => {
    expect(Object.keys(exported)).toEqual([
      "format",
      "version",
      "exportedAt",
      "account",
      "profile",
      "photos",
      "selfIdentification",
      "privacySettings",
      "discoveryPreferences",
      "verifications",
    ]);
    expect(exported.exportedAt).toBe("2026-11-21T10:00:00.000Z");
    expect(exported.account).toMatchObject({ id: "u1", email: "amani@example.com" });
    expect(exported.account.signInMethods).toEqual([
      { provider: "credential", linkedAt: "2026-11-01T08:00:00.000Z" },
    ]);
    expect(exported.profile).toMatchObject({ displayName: "Amani", dateOfBirth: "1995-03-07" });
    expect(exported.photos[0]).toMatchObject({ position: 0, contentType: "image/jpeg" });
    expect(exported.selfIdentification?.identity).toBe("person_of_short_stature");
    expect(exported.privacySettings?.allowMessagesFrom).toBe("matches_only");
    expect(exported.discoveryPreferences).toMatchObject({ minAge: 25, maxAge: 40 });
    expect(exported.verifications[0]).toMatchObject({ kind: "age", status: "approved" });
  });

  it("never includes passwords, tokens or internal storage keys", () => {
    expect(json).not.toMatch(/SECRET/);
    expect(json).not.toMatch(/"(password|token|accessToken|refreshToken|idToken|storageKey)"/);
  });

  it("is plain JSON (dates as ISO strings)", () => {
    expect(JSON.parse(json)).toEqual(exported);
  });

  it("handles a member without a profile yet", () => {
    const empty = buildMemberExport(
      {
        ...rows,
        profile: null,
        photos: [],
        selfIdentification: null,
        privacySettings: null,
        discoveryPreferences: null,
        verificationRequests: [],
      },
      new Date(),
    );
    expect(empty.profile).toBeNull();
    expect(empty.photos).toEqual([]);
  });
});
