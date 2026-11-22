import { existsSync } from "node:fs";
import { defineConfig } from "vitest/config";

// TEST_DATABASE_URL (repo-root .env) enables the database integration tests.
if (!process.env.TEST_DATABASE_URL && existsSync(".env")) process.loadEnvFile(".env");

export default defineConfig({
  test: {
    include: ["packages/*/src/**/*.test.ts", "apps/*/src/**/*.test.ts"],
    environment: "node",
    passWithNoTests: false,
  },
});
