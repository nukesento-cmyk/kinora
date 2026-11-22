import { sql } from "drizzle-orm";
import { bigserial, check, index, jsonb, pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";
import { createdAt } from "./columns";
import { auditActorType } from "./enums";

/**
 * Append-only audit trail (idea.md §16, §21: every sensitive staff action is logged).
 * A database trigger (see migration 0001) rejects UPDATE and DELETE, so entries
 * can't be edited or removed even by the application's own role.
 * Metadata must never contain message bodies, documents or passwords.
 */
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: bigserial("id", { mode: "bigint" }).primaryKey(),
    actorType: auditActorType("actor_type").notNull(),
    actorId: text("actor_id"),
    /** "<module>.<verb>", e.g. "member.suspend", "verification.review". */
    action: varchar("action", { length: 64 }).notNull(),
    targetType: varchar("target_type", { length: 64 }),
    targetId: text("target_id"),
    requestId: uuid("request_id"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: createdAt(),
  },
  (t) => [
    check("audit_action_format", sql`${t.action} ~ '^[a-z_]+\\.[a-z_]+$'`),
    check("audit_actor_present", sql`(${t.actorType} = 'system') OR (${t.actorId} IS NOT NULL)`),
    index("audit_logs_actor_idx").on(t.actorType, t.actorId, t.createdAt),
    index("audit_logs_target_idx").on(t.targetType, t.targetId, t.createdAt),
    index("audit_logs_created_idx").on(t.createdAt),
  ],
);
