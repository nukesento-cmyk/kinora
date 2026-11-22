import { randomBytes } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Client, Pool } from "pg";
import * as schema from "../schema";

const migrationsFolder = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../migrations",
);

/** Set TEST_DATABASE_URL to a Postgres server URL (any database) to enable integration tests. */
export const testDatabaseUrl = process.env.TEST_DATABASE_URL;

/**
 * Create a throwaway database, apply every migration, and return a client plus cleanup.
 * Each test file gets its own database, so tests can't leak state into each other.
 */
export async function createTestDatabase() {
  if (!testDatabaseUrl) throw new Error("TEST_DATABASE_URL is not set");
  const name = `kinora_test_${randomBytes(6).toString("hex")}`;

  const admin = new Client({ connectionString: testDatabaseUrl });
  await admin.connect();
  await admin.query(`CREATE DATABASE ${name}`);
  await admin.end();

  const url = new URL(testDatabaseUrl);
  url.pathname = `/${name}`;
  const pool = new Pool({ connectionString: url.toString(), max: 4 });
  const db = drizzle({ client: pool, schema });
  await migrate(db, { migrationsFolder });

  return {
    db,
    pool,
    async drop() {
      await pool.end();
      const c = new Client({ connectionString: testDatabaseUrl });
      await c.connect();
      await c.query(`DROP DATABASE IF EXISTS ${name} WITH (FORCE)`);
      await c.end();
    },
  };
}
