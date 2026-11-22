import { sql } from "drizzle-orm";
import { check, pgTable, primaryKey, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { authUserId, createdAt } from "./columns";

/**
 * Staff role-based access (idea.md §21): permissions are granted to roles,
 * roles to staff accounts. No role implies unrestricted access.
 */
export const staffRoles = pgTable(
  "staff_roles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    key: varchar("key", { length: 64 }).notNull().unique(),
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),
    createdAt: createdAt(),
  },
  (t) => [check("staff_roles_key_format", sql`${t.key} ~ '^[a-z][a-z0-9_]*$'`)],
);

export const staffRolePermissions = pgTable(
  "staff_role_permissions",
  {
    roleId: uuid("role_id")
      .notNull()
      .references(() => staffRoles.id, { onDelete: "cascade" }),
    /** "<module>.<action>", e.g. "members.read", "verification.review". */
    permission: varchar("permission", { length: 64 }).notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.roleId, t.permission] }),
    check("staff_permission_format", sql`${t.permission} ~ '^[a-z_]+\\.[a-z_]+$'`),
  ],
);

export const staffRoleAssignments = pgTable(
  "staff_role_assignments",
  {
    staffUserId: authUserId("staff_user_id").notNull(),
    roleId: uuid("role_id")
      .notNull()
      .references(() => staffRoles.id, { onDelete: "restrict" }),
    grantedBy: authUserId("granted_by").notNull(),
    grantedAt: timestamp("granted_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.staffUserId, t.roleId] }),
    check("staff_no_self_grant", sql`${t.staffUserId} <> ${t.grantedBy}`),
  ],
);
