import { parseEnv } from "@kinora/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { z } from "zod";
import * as schema from "./schema";

const dbEnvSchema = z.object({
  DATABASE_URL: z
    .string()
    .refine((u) => /^postgres(ql)?:\/\//.test(u), "must be a postgres:// or postgresql:// URL"),
});

export type Database = ReturnType<typeof createDb>;

/**
 * Create a Drizzle client on node-postgres. Works with the local Docker database
 * and with Neon (use its pooled connection string with ?sslmode=require).
 * Server-side only. The pool connects lazily on first query.
 */
export function createDb(source: Record<string, string | undefined> = process.env) {
  const { DATABASE_URL } = parseEnv(dbEnvSchema, source);
  const pool = new Pool({ connectionString: DATABASE_URL, max: 10 });
  return drizzle({ client: pool, schema });
}
