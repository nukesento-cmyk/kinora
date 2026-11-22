import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Client } from "pg";

/**
 * Migration runner used by `pnpm db:migrate`.
 * Replaces `drizzle-kit migrate`, which exits without printing the cause when it
 * can't connect or log in. This one waits for a database that is still starting
 * and explains every failure with the fix.
 */

const here = path.dirname(fileURLToPath(import.meta.url));
export const migrationsFolder = path.resolve(here, "../migrations");

interface PgLikeError {
  code?: string;
  message?: string;
  errors?: PgLikeError[];
}

/** Connection-level error code, looking inside AggregateError (IPv4 + IPv6 attempts). */
export function errorCode(error: unknown): string | undefined {
  const e = error as PgLikeError | undefined;
  if (!e) return undefined;
  if (e.code) return e.code;
  return e.errors?.find((inner) => inner.code)?.code;
}

/** host:port/database and user from a URL, never the password. */
export function describeTarget(url: string): { where: string; user: string } {
  try {
    const u = new URL(url);
    return {
      where: `${u.hostname}:${u.port || "5432"}${u.pathname}`,
      user: decodeURIComponent(u.username || "(none)"),
    };
  } catch {
    return { where: "(unparseable DATABASE_URL)", user: "(unknown)" };
  }
}

/** Turn a database error into a message that says what happened and how to fix it. */
export function explainDbError(error: unknown, url: string): string {
  const { where, user } = describeTarget(url);
  const code = errorCode(error);
  switch (code) {
    case "ECONNREFUSED":
      return [
        `Nothing is accepting connections at ${where}.`,
        "Start the local database with `pnpm db:up` (Docker Desktop, Colima or OrbStack must be running),",
        "then run `pnpm db:migrate` again. Check it with `docker compose ps`.",
      ].join("\n");
    case "ENOTFOUND":
    case "EAI_AGAIN":
      return `The database host in DATABASE_URL (${where}) can't be found. Check the hostname.`;
    case "ETIMEDOUT":
      return `Connecting to ${where} timed out. Check the host, port and any firewall or VPN.`;
    case "28P01":
      return [
        `The database at ${where} rejected the password for user "${user}".`,
        "If this is the local Docker database, DATABASE_URL should match docker-compose.yml",
        "(kinora / kinora). If you changed the password after the first start, reset the volume:",
        "`pnpm db:down && docker volume rm kinora_kinora-db && pnpm db:up`.",
      ].join("\n");
    case "28000":
      return [
        `A Postgres server answered at ${where}, but user "${user}" doesn't exist there.`,
        "This usually means a different Postgres (Homebrew, Postgres.app, another container) is",
        "already using that port. Stop it, or change the port in docker-compose.yml and DATABASE_URL.",
      ].join("\n");
    case "3D000":
      return [
        `The server at ${where} is reachable, but that database doesn't exist.`,
        "For the local Docker database the name is `kinora`. Check the end of DATABASE_URL.",
      ].join("\n");
    case "57P03":
      return `The database at ${where} is still starting up. Wait a few seconds and try again.`;
    default: {
      const message = (error as PgLikeError | undefined)?.message ?? String(error);
      return `Migration failed (${code ?? "no error code"}) at ${where}: ${message}`;
    }
  }
}

/** Errors that mean "not ready yet": worth retrying for a database that was just started. */
const RETRYABLE = new Set(["ECONNREFUSED", "57P03", "ECONNRESET"]);

export async function waitForDatabase(
  url: string,
  { timeoutMs = 20_000, intervalMs = 500 }: { timeoutMs?: number; intervalMs?: number } = {},
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const client = new Client({ connectionString: url, connectionTimeoutMillis: 5_000 });
    try {
      await client.connect();
      await client.query("SELECT 1");
      await client.end();
      return;
    } catch (error) {
      await client.end().catch(() => {});
      const code = errorCode(error);
      if (!code || !RETRYABLE.has(code) || Date.now() >= deadline) throw error;
      await new Promise((r) => setTimeout(r, intervalMs));
    }
  }
}

async function appliedCount(client: Client): Promise<number> {
  // Check existence first: a query naming a missing table fails even inside a CASE.
  const exists = await client.query<{ t: string | null }>(
    `SELECT to_regclass('drizzle.__drizzle_migrations')::text AS t`,
  );
  if (!exists.rows[0]?.t) return 0;
  const r = await client.query<{ n: number }>(
    `SELECT count(*)::int AS n FROM drizzle.__drizzle_migrations`,
  );
  return r.rows[0]?.n ?? 0;
}

/** Apply all pending migrations. Returns how many were applied in this run. */
export async function runMigrations(
  url: string,
  options?: { timeoutMs?: number },
): Promise<{ applied: number; total: number }> {
  await waitForDatabase(url, options);
  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    const before = await appliedCount(client);
    await migrate(drizzle({ client }), { migrationsFolder });
    const total = await appliedCount(client);
    return { applied: total - before, total };
  } finally {
    await client.end();
  }
}

/** Load DATABASE_URL from the repo-root .env if it isn't already set. */
export function loadDatabaseUrl(env: Record<string, string | undefined> = process.env): string {
  if (!env.DATABASE_URL) {
    const rootEnv = path.resolve(here, "../../../.env");
    if (existsSync(rootEnv)) process.loadEnvFile(rootEnv);
  }
  const url = env.DATABASE_URL ?? process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env at the repo root (`cp .env.example .env`).",
    );
  }
  if (!/^postgres(ql)?:\/\//.test(url)) {
    throw new Error("DATABASE_URL must start with postgres:// or postgresql://.");
  }
  return url;
}

async function main() {
  let url: string;
  try {
    url = loadDatabaseUrl();
  } catch (error) {
    console.error(`✗ ${(error as Error).message}`);
    process.exit(1);
  }
  const { where } = describeTarget(url);
  console.log(`→ Migrating ${where}`);
  try {
    const { applied, total } = await runMigrations(url);
    console.log(
      applied === 0
        ? `✓ Already up to date (${total} migrations applied).`
        : `✓ Applied ${applied} migration${applied === 1 ? "" : "s"} (${total} total).`,
    );
  } catch (error) {
    console.error(`✗ ${explainDbError(error, url)}`);
    process.exit(1);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  void main();
}
