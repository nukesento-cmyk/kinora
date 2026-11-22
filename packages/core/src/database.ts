import { createDb, type Database } from "@kinora/db";

export type { Database };

const KEY = Symbol.for("kinora.database");

/**
 * The process-wide database client for server code. Apps hold this handle only to
 * pass it to core services; they never query it themselves (ESLint enforces that
 * apps can't import @kinora/db).
 */
export function getDatabase(env: Record<string, string | undefined> = process.env): Database {
  const g = globalThis as { [KEY]?: Database };
  g[KEY] ??= createDb(env);
  return g[KEY];
}
