import { z } from "zod";

export class EnvValidationError extends Error {
  constructor(public readonly issues: string[]) {
    super(`Invalid environment configuration:\n${issues.map((i) => `  - ${i}`).join("\n")}`);
    this.name = "EnvValidationError";
  }
}

/**
 * Validate a set of environment variables against a Zod object schema.
 * Throws EnvValidationError listing every problem (names only, never values),
 * so a misconfigured deployment fails at boot instead of at first use.
 */
export function parseEnv<T extends z.ZodObject>(
  schema: T,
  source: Record<string, string | undefined>,
): z.infer<T> {
  const result = schema.safeParse(source);
  if (!result.success) {
    const issues = result.error.issues.map((issue) => {
      const key = issue.path.join(".") || "(root)";
      return `${key}: ${issue.message}`;
    });
    throw new EnvValidationError(issues);
  }
  return result.data;
}

/** Treat empty strings as "not set", which is how unset vars often arrive from .env files. */
export const optionalString = z
  .string()
  .optional()
  .transform((v) => (v === undefined || v.trim() === "" ? undefined : v.trim()));

/** Variables every app needs. */
export const sharedEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.url(),
  ADMIN_URL: z.url(),
  LAUNCH_MARKETS: z.string().min(2),
});
