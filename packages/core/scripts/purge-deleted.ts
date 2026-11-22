/**
 * `pnpm jobs:purge-deleted`: hard-delete accounts whose deletion grace period has ended.
 * Run it on a schedule (daily is enough). Each deleted account gets a system entry in
 * audit_logs. Safe to run repeatedly and concurrently with the app.
 *
 * Reads DATABASE_URL and ACCOUNT_DELETION_GRACE_DAYS (default 30) from the environment
 * or the repo-root .env.
 */
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DEFAULT_ACCOUNT_DELETION_GRACE_DAYS, optionalString, parseEnv } from "@kinora/config";
import { createDb } from "@kinora/db";
import { z } from "zod";
import { purgeDeletedAccounts } from "../src/identity/repository";

const here = path.dirname(fileURLToPath(import.meta.url));
const rootEnv = path.resolve(here, "../../../.env");
if (!process.env.DATABASE_URL && existsSync(rootEnv)) process.loadEnvFile(rootEnv);

const jobEnvSchema = z.object({
  ACCOUNT_DELETION_GRACE_DAYS: optionalString
    .transform((v) => v ?? String(DEFAULT_ACCOUNT_DELETION_GRACE_DAYS))
    .pipe(z.coerce.number<string>().int().min(1).max(365)),
});

async function main() {
  const env = parseEnv(jobEnvSchema, process.env);
  const db = createDb(process.env);
  try {
    const { purged } = await purgeDeletedAccounts(db, {
      now: new Date(),
      graceDays: env.ACCOUNT_DELETION_GRACE_DAYS,
    });
    console.log(
      `✓ Purged ${purged.length} account${purged.length === 1 ? "" : "s"} past the ${env.ACCOUNT_DELETION_GRACE_DAYS}-day grace period.`,
    );
  } finally {
    await db.$client.end();
  }
}

main().catch((error: unknown) => {
  console.error(`✗ Purge failed: ${(error as Error).message}`);
  process.exit(1);
});
