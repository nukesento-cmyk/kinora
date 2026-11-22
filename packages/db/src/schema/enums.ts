import { pgEnum } from "drizzle-orm/pg-core";

/** What a member is here for (idea.md §8, §11). Members can pick several. */
export const connectionIntention = pgEnum("connection_intention", [
  "dating",
  "friendship",
  "community",
  "events",
  "professional",
]);

/** Voluntary self-identification (idea.md §8). Sensitive: see member_self_identification. */
export const memberIdentity = pgEnum("member_identity", [
  "person_of_short_stature",
  "interested_member",
  "family_member",
  "ally",
  "prefer_not_to_say",
]);

/** Who can see a photo. Private photos are only ever served through short-lived signed URLs. */
export const photoVisibility = pgEnum("photo_visibility", ["members", "matches", "private"]);

export const moderationStatus = pgEnum("moderation_status", ["pending", "approved", "rejected"]);

export const profileVisibility = pgEnum("profile_visibility", ["members", "hidden"]);

export const messagePermission = pgEnum("message_permission", [
  "matches_only",
  "connections",
  "verified_members",
]);

export const verificationKind = pgEnum("verification_kind", ["identity", "age", "liveness"]);

export const verificationStatus = pgEnum("verification_status", [
  "pending",
  "approved",
  "declined",
  "expired",
  "error",
]);

export const auditActorType = pgEnum("audit_actor_type", ["member", "staff", "system"]);
