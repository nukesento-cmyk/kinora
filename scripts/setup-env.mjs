#!/usr/bin/env node
// Creates local env files from .env.example and fills in a generated BETTER_AUTH_SECRET.
// Safe to re-run: existing files are kept, and only empty BETTER_AUTH_SECRET values are filled.
//   pnpm setup:env
import { randomBytes } from "node:crypto";
import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const example = path.join(root, ".env.example");
const targets = [".env", "apps/web/.env.local", "apps/admin/.env.local"];

for (const rel of targets) {
  const file = path.join(root, rel);
  const created = !existsSync(file);
  if (created) copyFileSync(example, file);

  const text = readFileSync(file, "utf8");
  let filled = false;
  const next = text.replace(/^BETTER_AUTH_SECRET=\s*$/m, () => {
    filled = true;
    return `BETTER_AUTH_SECRET=${randomBytes(32).toString("base64")}`;
  });
  if (filled) writeFileSync(file, next);

  const notes = [created ? "created" : "kept", filled ? "generated BETTER_AUTH_SECRET" : null]
    .filter(Boolean)
    .join(", ");
  console.log(`✓ ${rel} (${notes})`);
}
console.log("\nNext: pnpm db:up && pnpm db:migrate && pnpm dev");
