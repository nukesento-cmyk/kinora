// Runs once when the server starts: a misconfigured deployment fails immediately
// (for example production without RESEND_API_KEY and EMAIL_FROM, or with DEV_MAILBOX on).
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { getAuthEnv, getServerEnv } = await import("./env");
    try {
      getServerEnv();
      getAuthEnv();
    } catch (error) {
      console.error(error instanceof Error ? error.message : error);
      if (process.env.NODE_ENV !== "production") {
        console.error(
          "\nFix for local development: run `pnpm setup:env` in the repo root, then restart.\n" +
            "It creates apps/web/.env.local from .env.example with a generated BETTER_AUTH_SECRET.",
        );
      }
      process.exit(1);
    }
  }
}
