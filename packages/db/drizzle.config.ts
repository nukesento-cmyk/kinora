import { existsSync } from "node:fs";
import path from "node:path";
import { defineConfig } from "drizzle-kit";

// Database scripts read DATABASE_URL from the repo-root .env (see .env.example).
const rootEnv = path.resolve(process.cwd(), "../../.env");
if (!process.env.DATABASE_URL && existsSync(rootEnv)) process.loadEnvFile(rootEnv);

// Migrations are generated from src/schema and committed to the repo.
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema/index.ts",
  out: "./migrations",
  strict: true,
  verbose: true,
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
});
