import { optionalString, parseEnv } from "@kinora/config";
import { z } from "zod";

/**
 * Who operates the service, as shown on the legal pages. Everything is optional:
 * until the company details are confirmed, the drafts say so instead of inventing them.
 */
const legalEnvSchema = z.object({
  NEXT_PUBLIC_LEGAL_ENTITY_NAME: optionalString.pipe(z.string().max(120).optional()),
  NEXT_PUBLIC_LEGAL_ADDRESS: optionalString.pipe(z.string().max(300).optional()),
  NEXT_PUBLIC_PRIVACY_EMAIL: optionalString.pipe(z.email().optional()),
});

export interface LegalConfig {
  entityName: string | undefined;
  address: string | undefined;
  /** Address for privacy requests. Falls back to the support address when only that is set. */
  privacyEmail: string | undefined;
}

export function getLegalConfig(
  source: Record<string, string | undefined>,
  supportEmail?: string,
): LegalConfig {
  const env = parseEnv(legalEnvSchema, source);
  return {
    entityName: env.NEXT_PUBLIC_LEGAL_ENTITY_NAME,
    address: env.NEXT_PUBLIC_LEGAL_ADDRESS,
    privacyEmail: env.NEXT_PUBLIC_PRIVACY_EMAIL ?? supportEmail,
  };
}
