import { z } from "zod";
import { optionalString } from "./env";

const postgresUrl = z
  .string()
  .refine((u) => /^postgres(ql)?:\/\//.test(u), "must be a postgres:// or postgresql:// URL");

/** "name@example.com" or "Display Name <name@example.com>". */
const emailSender = z
  .string()
  .refine(
    (v) =>
      /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(v) ||
      /^[^<>]+<[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+>$/.test(v),
    'must be an email address, optionally as "Name <address>"',
  );

const flag = optionalString.pipe(z.enum(["true", "false"]).optional());

export const DEFAULT_ACCOUNT_DELETION_GRACE_DAYS = 30;

/**
 * Variables the member app needs for sign-in, email and account deletion.
 * Validated at boot (src/instrumentation.ts), so a production deployment without
 * real email delivery, or with the development mailbox switched on, never starts.
 */
export const authEnvSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    APP_URL: z.url(),
    DATABASE_URL: postgresUrl,
    /** Signs session cookies and tokens. Generate with `openssl rand -base64 32`. */
    BETTER_AUTH_SECRET: z.string().min(32, "must be at least 32 characters"),
    ACCOUNT_DELETION_GRACE_DAYS: optionalString
      .transform((v) => v ?? String(DEFAULT_ACCOUNT_DELETION_GRACE_DAYS))
      .pipe(z.coerce.number<string>().int().min(1).max(365)),
    RESEND_API_KEY: optionalString,
    EMAIL_FROM: optionalString.pipe(emailSender.optional()),
    /** Records outgoing email at /api/dev/mailbox instead of sending it. Never in production. */
    DEV_MAILBOX: flag,
    GOOGLE_CLIENT_ID: optionalString,
    GOOGLE_CLIENT_SECRET: optionalString,
  })
  .superRefine((env, ctx) => {
    const production = env.NODE_ENV === "production";
    const resend = Boolean(env.RESEND_API_KEY && env.EMAIL_FROM);
    if (production) {
      if (!env.RESEND_API_KEY) {
        ctx.addIssue({
          code: "custom",
          path: ["RESEND_API_KEY"],
          message: "is required in production",
        });
      }
      if (!env.EMAIL_FROM) {
        ctx.addIssue({
          code: "custom",
          path: ["EMAIL_FROM"],
          message: "is required in production",
        });
      }
      if (env.DEV_MAILBOX === "true") {
        ctx.addIssue({
          code: "custom",
          path: ["DEV_MAILBOX"],
          message: "must not be enabled in production",
        });
      }
    } else if (!resend && env.DEV_MAILBOX !== "true") {
      ctx.addIssue({
        code: "custom",
        path: ["EMAIL_FROM"],
        message: "set RESEND_API_KEY and EMAIL_FROM, or DEV_MAILBOX=true for local development",
      });
    }
    if (Boolean(env.RESEND_API_KEY) !== Boolean(env.EMAIL_FROM) && !production) {
      ctx.addIssue({
        code: "custom",
        path: [env.RESEND_API_KEY ? "EMAIL_FROM" : "RESEND_API_KEY"],
        message: "RESEND_API_KEY and EMAIL_FROM must be set together",
      });
    }
    if (Boolean(env.GOOGLE_CLIENT_ID) !== Boolean(env.GOOGLE_CLIENT_SECRET)) {
      ctx.addIssue({
        code: "custom",
        path: [env.GOOGLE_CLIENT_ID ? "GOOGLE_CLIENT_SECRET" : "GOOGLE_CLIENT_ID"],
        message: "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set together",
      });
    }
  });

export type AuthEnv = z.infer<typeof authEnvSchema>;

/**
 * The development mailbox is reachable only outside production and only when
 * DEV_MAILBOX is exactly "true". Reads NODE_ENV at runtime from the given source.
 */
export function isDevMailboxEnabled(env: Record<string, string | undefined>): boolean {
  return env.NODE_ENV !== "production" && env.DEV_MAILBOX === "true";
}

/** Session cookies are Secure in production and whenever the app is served over HTTPS. */
export function shouldUseSecureCookies(env: { NODE_ENV?: string; APP_URL: string }): boolean {
  return env.NODE_ENV === "production" || env.APP_URL.startsWith("https://");
}
