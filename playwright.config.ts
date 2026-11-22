import { defineConfig, devices } from "@playwright/test";

const isCI = Boolean(process.env.CI);
// Ports are configurable so several checkouts can run e2e at the same time.
const webPort = Number(process.env.E2E_WEB_PORT ?? 3000);
const adminPort = Number(process.env.E2E_ADMIN_PORT ?? 3001);
const webURL = `http://localhost:${webPort}`;
const adminURL = `http://localhost:${adminPort}`;

// The member app needs a database for sign-up and sign-in. Migrations run before it starts.
const databaseUrl = process.env.E2E_DATABASE_URL ?? process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("Set DATABASE_URL (or E2E_DATABASE_URL) to a Postgres database for e2e tests.");
}

// E2E runs against production builds of both apps. Run `pnpm build` first.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  reporter: isCI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    trace: "on-first-retry",
    // Optional: set PW_BROWSER_CHANNEL=chrome to use an installed Google Chrome
    // instead of Playwright's downloaded Chromium.
    ...(process.env.PW_BROWSER_CHANNEL ? { channel: process.env.PW_BROWSER_CHANNEL } : {}),
  },
  projects: [
    {
      name: "web",
      testMatch: /web\..*\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], baseURL: webURL },
    },
    {
      name: "web-mobile",
      testMatch: /web\..*\.spec\.ts/,
      use: { ...devices["Pixel 7"], baseURL: webURL },
    },
    {
      name: "admin",
      testMatch: /admin\..*\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], baseURL: adminURL },
    },
  ],
  webServer: [
    {
      command: `pnpm db:migrate && pnpm --filter @kinora/web exec next start --port ${webPort}`,
      url: `${webURL}/api/health`,
      env: {
        // The /design review page is tested too; it's off in real deployments.
        ENABLE_DESIGN_PREVIEW: "true",
        // Test mode, not production: emails go to the dev mailbox (/api/dev/mailbox),
        // which the tests read verification and reset links from. Never set in production.
        NODE_ENV: "test",
        DEV_MAILBOX: "true",
        DATABASE_URL: databaseUrl,
        APP_URL: webURL,
        BETTER_AUTH_SECRET:
          process.env.BETTER_AUTH_SECRET ?? "e2e-only-secret-never-use-outside-tests-0000",
      },
      reuseExistingServer: !isCI,
      timeout: 60_000,
    },
    {
      command: `pnpm --filter @kinora/admin exec next start --port ${adminPort}`,
      url: `${adminURL}/api/health`,
      reuseExistingServer: !isCI,
      timeout: 60_000,
    },
  ],
});
