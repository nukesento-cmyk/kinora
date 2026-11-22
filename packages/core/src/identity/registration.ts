import { z } from "zod";
import {
  countryCodeSchema,
  isKnownCountryCode,
  registrationAvailability,
  type CountryCode,
} from "../markets";
import { checkDateOfBirth } from "./age";

export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_MAX_LENGTH = 128;
export const DISPLAY_NAME_MAX_LENGTH = 50;
export const EMAIL_MAX_LENGTH = 254;

/**
 * Field-level error codes. The app turns them into translated messages,
 * so core never carries user-facing copy.
 */
export type FieldErrorCode =
  "required" | "too_long" | "too_short" | "invalid" | "in_future" | "too_early" | "mismatch";

export const emailSchema = z
  .string({ error: "required" })
  .trim()
  .min(1, { error: "required" })
  .max(EMAIL_MAX_LENGTH, { error: "too_long" })
  .pipe(z.email({ error: "invalid" }))
  .transform((v) => v.toLowerCase());

export const newPasswordSchema = z
  .string({ error: "required" })
  .min(1, { error: "required" })
  .min(PASSWORD_MIN_LENGTH, { error: "too_short" })
  .max(PASSWORD_MAX_LENGTH, { error: "too_long" });

/** For sign-in and confirmation: any non-empty password, capped to stop hashing huge inputs. */
export const currentPasswordSchema = z
  .string({ error: "required" })
  .min(1, { error: "required" })
  .max(PASSWORD_MAX_LENGTH, { error: "invalid" });

export const displayNameSchema = z
  .string({ error: "required" })
  .trim()
  .min(1, { error: "required" })
  .max(DISPLAY_NAME_MAX_LENGTH, { error: "too_long" });

const countrySchema = z
  .string({ error: "required" })
  .trim()
  .min(1, { error: "required" })
  .pipe(countryCodeSchema.refine(isKnownCountryCode, { error: "invalid" }));

export const registrationSchema = z.object({
  displayName: displayNameSchema,
  email: emailSchema,
  password: newPasswordSchema,
  /** "YYYY-MM-DD". Age is checked separately by checkRegistration. */
  dateOfBirth: z.string({ error: "required" }).trim().min(1, { error: "required" }),
  countryCode: countrySchema,
});

export type RegistrationInput = z.infer<typeof registrationSchema>;
export type RegistrationField = keyof RegistrationInput;

export type FieldErrors<F extends string> = Partial<Record<F, FieldErrorCode>>;

export type ValidationResult<T, F extends string> =
  { ok: true; data: T } | { ok: false; errors: FieldErrors<F> };

/** Run a Zod schema and collect the first error code per field. */
export function validateFields<S extends z.ZodObject>(
  schema: S,
  input: unknown,
): ValidationResult<z.infer<S>, Extract<keyof z.infer<S>, string>> {
  const result = schema.safeParse(input);
  if (result.success) return { ok: true, data: result.data };
  const errors: Record<string, FieldErrorCode> = {};
  for (const issue of result.error.issues) {
    const field = String(issue.path[0] ?? "");
    if (!field || errors[field]) continue;
    errors[field] = toErrorCode(issue.message);
  }
  return { ok: false, errors: errors as FieldErrors<Extract<keyof z.infer<S>, string>> };
}

const CODES: ReadonlySet<string> = new Set<FieldErrorCode>([
  "required",
  "too_long",
  "too_short",
  "invalid",
  "in_future",
  "too_early",
  "mismatch",
]);
function toErrorCode(message: string): FieldErrorCode {
  return CODES.has(message) ? (message as FieldErrorCode) : "invalid";
}

/** Validate registration input, including that the date of birth is a real, past date. */
export function validateRegistration(
  input: unknown,
  now: Date,
): ValidationResult<RegistrationInput, RegistrationField> {
  const result = validateFields(registrationSchema, input);
  const dob = (input as { dateOfBirth?: unknown } | null)?.dateOfBirth;
  const dobErrors: FieldErrors<RegistrationField> = {};
  if (typeof dob === "string" && dob.trim()) {
    const check = checkDateOfBirth(dob, now);
    if (
      check.status === "invalid" ||
      check.status === "in_future" ||
      check.status === "too_early"
    ) {
      dobErrors.dateOfBirth = check.status;
    }
  }
  if (result.ok && !dobErrors.dateOfBirth) return result;
  return { ok: false, errors: { ...(result.ok ? {} : result.errors), ...dobErrors } };
}

export type RegistrationDecision =
  | { status: "eligible"; country: CountryCode }
  | { status: "under_age" }
  | { status: "waitlist"; country: CountryCode };

/**
 * Decide what happens to valid registration input: under-18s are turned away first
 * (we don't keep their details, not even for the waitlist), then the country decides
 * between signing up now and joining the waitlist.
 */
export function decideRegistration(
  input: Pick<RegistrationInput, "dateOfBirth" | "countryCode">,
  { markets, now }: { markets: ReadonlySet<CountryCode>; now: Date },
): RegistrationDecision {
  if (checkDateOfBirth(input.dateOfBirth, now).status !== "ok") return { status: "under_age" };
  const availability = registrationAvailability(input.countryCode, markets);
  if (availability.status === "open") return { status: "eligible", country: availability.country };
  if (availability.status === "waitlist")
    return { status: "waitlist", country: availability.country };
  // validateRegistration already rejects unknown countries; treat a stray one as closed.
  throw new Error("decideRegistration needs a validated country code");
}

/** Only allow redirects to a path on this site, never to another origin. */
export function safeRedirectPath(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  try {
    const url = new URL(value, "http://internal.invalid");
    if (url.origin !== "http://internal.invalid") return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

export const signInSchema = z.object({ email: emailSchema, password: currentPasswordSchema });
export const emailOnlySchema = z.object({ email: emailSchema });
export const confirmPasswordSchema = z.object({ password: currentPasswordSchema });

/** New password typed twice. Used for reset and change. */
export const newPasswordPairSchema = z
  .object({ newPassword: newPasswordSchema, confirmPassword: z.string({ error: "required" }) })
  .superRefine((v, ctx) => {
    if (!v.confirmPassword)
      ctx.addIssue({ code: "custom", path: ["confirmPassword"], message: "required" });
    else if (v.confirmPassword !== v.newPassword) {
      ctx.addIssue({ code: "custom", path: ["confirmPassword"], message: "mismatch" });
    }
  });

export const changePasswordSchema = z
  .object({
    currentPassword: currentPasswordSchema,
    newPassword: newPasswordSchema,
    confirmPassword: z.string({ error: "required" }),
  })
  .superRefine((v, ctx) => {
    if (!v.confirmPassword)
      ctx.addIssue({ code: "custom", path: ["confirmPassword"], message: "required" });
    else if (v.confirmPassword !== v.newPassword) {
      ctx.addIssue({ code: "custom", path: ["confirmPassword"], message: "mismatch" });
    }
  });
