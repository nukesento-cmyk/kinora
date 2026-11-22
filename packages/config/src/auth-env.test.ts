import { describe, expect, it } from "vitest";
import { authEnvSchema, isDevMailboxEnabled, shouldUseSecureCookies } from "./auth-env";
import { EnvValidationError, parseEnv } from "./env";

const SECRET = "x".repeat(32);
const base = {
  APP_URL: "http://localhost:3000",
  DATABASE_URL: "postgresql://kinora:kinora@localhost:5433/kinora",
  BETTER_AUTH_SECRET: SECRET,
};
const resend = { RESEND_API_KEY: "re_test_key", EMAIL_FROM: "KINORA <hello@example.com>" };

function issues(source: Record<string, string | undefined>): string[] {
  try {
    parseEnv(authEnvSchema, source);
    return [];
  } catch (error) {
    expect(error).toBeInstanceOf(EnvValidationError);
    return (error as EnvValidationError).issues;
  }
}

describe("authEnvSchema", () => {
  it("accepts a development setup with the dev mailbox and defaults the grace period to 30 days", () => {
    const env = parseEnv(authEnvSchema, { ...base, DEV_MAILBOX: "true" });
    expect(env.ACCOUNT_DELETION_GRACE_DAYS).toBe(30);
    expect(env.NODE_ENV).toBe("development");
  });

  it("reads the grace period from ACCOUNT_DELETION_GRACE_DAYS and rejects nonsense", () => {
    const env = parseEnv(authEnvSchema, { ...base, ...resend, ACCOUNT_DELETION_GRACE_DAYS: "14" });
    expect(env.ACCOUNT_DELETION_GRACE_DAYS).toBe(14);
    for (const bad of ["0", "-3", "1.5", "forever", "400"]) {
      expect(issues({ ...base, ...resend, ACCOUNT_DELETION_GRACE_DAYS: bad }).join()).toContain(
        "ACCOUNT_DELETION_GRACE_DAYS",
      );
    }
  });

  it("requires a secret of at least 32 characters", () => {
    expect(issues({ ...base, ...resend, BETTER_AUTH_SECRET: "short" }).join()).toContain(
      "BETTER_AUTH_SECRET",
    );
    expect(issues({ ...base, ...resend, BETTER_AUTH_SECRET: undefined }).join()).toContain(
      "BETTER_AUTH_SECRET",
    );
  });

  it("refuses to boot in production without real email delivery", () => {
    const found = issues({ ...base, NODE_ENV: "production" }).join("\n");
    expect(found).toContain("RESEND_API_KEY");
    expect(found).toContain("EMAIL_FROM");
    expect(issues({ ...base, ...resend, NODE_ENV: "production" })).toEqual([]);
  });

  it("refuses the dev mailbox in production", () => {
    expect(
      issues({ ...base, ...resend, NODE_ENV: "production", DEV_MAILBOX: "true" }).join(),
    ).toContain("DEV_MAILBOX");
  });

  it("needs some way to deliver email outside production", () => {
    expect(issues({ ...base }).join()).toContain("EMAIL_FROM");
    expect(issues({ ...base, RESEND_API_KEY: "re_only" }).join()).toContain("EMAIL_FROM");
  });

  it("validates the sender address", () => {
    expect(issues({ ...base, RESEND_API_KEY: "k", EMAIL_FROM: "not an address" }).join()).toContain(
      "EMAIL_FROM",
    );
    expect(issues({ ...base, RESEND_API_KEY: "k", EMAIL_FROM: "hello@example.com" })).toEqual([]);
  });

  it("needs both Google credentials or neither", () => {
    expect(issues({ ...base, ...resend, GOOGLE_CLIENT_ID: "id" }).join()).toContain(
      "GOOGLE_CLIENT_SECRET",
    );
    expect(
      issues({ ...base, ...resend, GOOGLE_CLIENT_ID: "id", GOOGLE_CLIENT_SECRET: "s" }),
    ).toEqual([]);
  });

  it("never echoes secret values", () => {
    const found = issues({
      ...base,
      BETTER_AUTH_SECRET: "tiny-secret-value",
      RESEND_API_KEY: "re_live_abc",
    });
    expect(found.join()).not.toContain("tiny-secret-value");
    expect(found.join()).not.toContain("re_live_abc");
  });
});

describe("isDevMailboxEnabled", () => {
  it("is on only outside production and only for exactly 'true'", () => {
    expect(isDevMailboxEnabled({ NODE_ENV: "development", DEV_MAILBOX: "true" })).toBe(true);
    expect(isDevMailboxEnabled({ NODE_ENV: "test", DEV_MAILBOX: "true" })).toBe(true);
    expect(isDevMailboxEnabled({ NODE_ENV: "production", DEV_MAILBOX: "true" })).toBe(false);
    expect(isDevMailboxEnabled({ NODE_ENV: "development", DEV_MAILBOX: "1" })).toBe(false);
    expect(isDevMailboxEnabled({ NODE_ENV: "development" })).toBe(false);
  });
});

describe("shouldUseSecureCookies", () => {
  it("is on in production and on any HTTPS origin", () => {
    expect(
      shouldUseSecureCookies({ NODE_ENV: "production", APP_URL: "http://localhost:3000" }),
    ).toBe(true);
    expect(
      shouldUseSecureCookies({ NODE_ENV: "test", APP_URL: "https://preview.example.com" }),
    ).toBe(true);
    expect(shouldUseSecureCookies({ NODE_ENV: "test", APP_URL: "http://localhost:3200" })).toBe(
      false,
    );
  });
});
