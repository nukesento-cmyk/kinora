import { schema, type Database } from "@kinora/db";
import { betterAuth, type BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware } from "better-auth/api";
import type { EmailMessage, Mailer } from "../email";
import type { CountryCode } from "../markets";
import {
  decideRegistration,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  validateRegistration,
} from "./registration";
import { cancelAccountDeletion, createMemberProfile, deleteAccount } from "./repository";
import { AUTH_COOKIE_PREFIX } from "./session-cookie";

/** Paths (under /api/auth) whose rules are stricter than the default. */
export const AUTH_RATE_LIMITS = {
  default: { window: 60, max: 100 },
  "/sign-in/email": { window: 60, max: 5 },
  "/sign-up/email": { window: 60, max: 5 },
  "/request-password-reset": { window: 60, max: 3 },
  "/reset-password": { window: 60, max: 5 },
  "/send-verification-email": { window: 60, max: 3 },
  "/verify-email": { window: 60, max: 10 },
  "/change-password": { window: 60, max: 5 },
  "/verify-password": { window: 60, max: 5 },
  "/sign-in/social": { window: 60, max: 10 },
} as const;

export const SESSION_EXPIRES_IN_SECONDS = 60 * 60 * 24 * 14;

/** Error codes the hooks raise, so the app can show the right message. */
export const REGISTRATION_ERRORS = {
  invalid: "INVALID_REGISTRATION",
  underAge: "UNDER_MINIMUM_AGE",
  regionClosed: "REGION_NOT_OPEN",
  notAllowed: "SIGN_UP_NOT_ALLOWED",
} as const;

export interface AuthEmailTemplates {
  verifyEmail(input: { to: string; name: string; url: string }): EmailMessage;
  resetPassword(input: { to: string; name: string; url: string }): EmailMessage;
  /** Someone tried to register with an address that already has an account. */
  existingAccount(input: {
    to: string;
    name: string;
    signInUrl: string;
    resetUrl: string;
  }): EmailMessage;
}

export interface AuthDependencies {
  db: Database;
  appUrl: string;
  secret: string;
  secureCookies: boolean;
  markets: ReadonlySet<CountryCode>;
  mailer: Mailer;
  emails: AuthEmailTemplates;
  google?: { clientId: string; clientSecret: string } | undefined;
  /**
   * Run work after the response (e.g. Next.js `after`). Emails are sent this way so
   * that responses take the same time whether or not an account exists.
   */
  runInBackground?: (task: Promise<unknown>) => void;
  now?: () => Date;
  /** Tests only: switch off rate limiting. */
  rateLimitEnabled?: boolean;
  logLevel?: "debug" | "info" | "warn" | "error";
}

/** Map the sign-up request body to registration input. */
function registrationInput(body: unknown) {
  const b = (body ?? {}) as Record<string, unknown>;
  return {
    displayName: b.name,
    email: b.email,
    password: b.password,
    dateOfBirth: b.dateOfBirth,
    countryCode: b.countryCode,
  };
}

/**
 * Self-hosted Better Auth for the member app. Users and sessions live in our Postgres.
 *
 * Every sign-up, whichever way it reaches the server, passes the same checks: the
 * before-hook validates input, the 18+ rule and the launch market, and no user row
 * can be created by any other path (Google sign-in can only sign in to existing,
 * linked accounts). The profile is created with the account and, if that fails,
 * the account is removed again.
 */
export function createAuth(deps: AuthDependencies) {
  const now = deps.now ?? (() => new Date());
  const origin = new URL(deps.appUrl).origin;
  const send = (message: EmailMessage) => {
    const task = deps.mailer.send(message);
    if (deps.runInBackground) {
      deps.runInBackground(
        task.catch((error: unknown) => console.error("[auth] email delivery failed", error)),
      );
      return Promise.resolve();
    }
    return task;
  };

  const options = {
    appName: "member",
    baseURL: deps.appUrl,
    secret: deps.secret,
    trustedOrigins: [origin],
    telemetry: { enabled: false },
    logger: { level: deps.logLevel ?? "warn" },
    database: drizzleAdapter(deps.db, {
      provider: "pg",
      transaction: true,
      schema: {
        user: schema.authUser,
        session: schema.authSession,
        account: schema.authAccount,
        verification: schema.authVerification,
        rateLimit: schema.authRateLimit,
      },
    }),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      autoSignIn: false,
      minPasswordLength: PASSWORD_MIN_LENGTH,
      maxPasswordLength: PASSWORD_MAX_LENGTH,
      resetPasswordTokenExpiresIn: 60 * 60,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, token }) => {
        const url = `${origin}/reset-password?token=${encodeURIComponent(token)}`;
        await send(deps.emails.resetPassword({ to: user.email, name: user.name, url }));
      },
      onExistingUserSignUp: async ({ user }) => {
        await send(
          deps.emails.existingAccount({
            to: user.email,
            name: user.name,
            signInUrl: `${origin}/login`,
            resetUrl: `${origin}/forgot-password`,
          }),
        );
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      sendOnSignIn: true,
      autoSignInAfterVerification: false,
      expiresIn: 60 * 60 * 24,
      sendVerificationEmail: async ({ user, token }) => {
        const url = `${origin}/verify-email?token=${encodeURIComponent(token)}`;
        await send(deps.emails.verifyEmail({ to: user.email, name: user.name, url }));
      },
    },
    socialProviders: deps.google
      ? {
          google: {
            clientId: deps.google.clientId,
            clientSecret: deps.google.clientSecret,
            // New members register with the form (date of birth, country). Google
            // only signs in to an account that already exists for the same address.
            disableSignUp: true,
            prompt: "select_account",
          },
        }
      : {},
    account: {
      accountLinking: { enabled: true, trustedProviders: ["google"] },
    },
    session: {
      expiresIn: SESSION_EXPIRES_IN_SECONDS,
      updateAge: 60 * 60 * 24,
    },
    rateLimit: {
      enabled: deps.rateLimitEnabled ?? true,
      storage: "database",
      modelName: "rateLimit",
      window: AUTH_RATE_LIMITS.default.window,
      max: AUTH_RATE_LIMITS.default.max,
      customRules: Object.fromEntries(
        Object.entries(AUTH_RATE_LIMITS).filter(([path]) => path !== "default"),
      ),
    },
    advanced: {
      cookiePrefix: AUTH_COOKIE_PREFIX,
      useSecureCookies: deps.secureCookies,
      defaultCookieAttributes: {
        httpOnly: true,
        sameSite: "lax",
        secure: deps.secureCookies,
        path: "/",
      },
      ipAddress: { ipAddressHeaders: ["x-forwarded-for"] },
      ...(deps.runInBackground ? { backgroundTasks: { handler: deps.runInBackground } } : {}),
    },
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        if (ctx.path !== "/sign-up/email") return;
        const at = now();
        const result = validateRegistration(registrationInput(ctx.body), at);
        if (!result.ok) {
          throw APIError.from("BAD_REQUEST", {
            code: REGISTRATION_ERRORS.invalid,
            message: `Invalid fields: ${Object.keys(result.errors).join(", ")}`,
          });
        }
        const decision = decideRegistration(result.data, { markets: deps.markets, now: at });
        if (decision.status === "under_age") {
          throw APIError.from("FORBIDDEN", {
            code: REGISTRATION_ERRORS.underAge,
            message: "Members must be 18 or older",
          });
        }
        if (decision.status === "waitlist") {
          throw APIError.from("FORBIDDEN", {
            code: REGISTRATION_ERRORS.regionClosed,
            message: "Registration isn't open in this country yet",
          });
        }
      }),
    },
    databaseHooks: {
      user: {
        create: {
          // The only way to create a user is the email sign-up, which the hook above checked.
          before: async (_user, ctx) => (ctx?.path === "/sign-up/email" ? undefined : false),
          after: async (user, ctx) => {
            const result = validateRegistration(registrationInput(ctx?.body), now());
            try {
              if (!result.ok) throw new Error("registration input missing after sign-up checks");
              await createMemberProfile(deps.db, {
                userId: user.id,
                displayName: result.data.displayName,
                dateOfBirth: result.data.dateOfBirth,
                countryCode: result.data.countryCode,
              });
            } catch (error) {
              // Never leave an account without its profile (and age record) behind.
              await deleteAccount(deps.db, user.id);
              throw error;
            }
          },
        },
      },
      session: {
        create: {
          after: async (session) => {
            await cancelAccountDeletion(deps.db, session.userId);
          },
        },
      },
    },
  } satisfies BetterAuthOptions;

  return betterAuth(options);
}

export type Auth = ReturnType<typeof createAuth>;
