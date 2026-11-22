import { optionalString, parseEnv } from "@kinora/config";
import { z } from "zod";

/**
 * Brand configuration. The name is a working name pending trademark checks
 * (idea.md §1), so nothing in the apps may hardcode it: read it from here.
 * Colours, logo and type tokens join this module in milestone 1.3.
 */
const brandEnvSchema = z.object({
  NEXT_PUBLIC_BRAND_NAME: optionalString.pipe(z.string().max(40).optional()),
  NEXT_PUBLIC_BRAND_TAGLINE: optionalString.pipe(z.string().max(120).optional()),
  NEXT_PUBLIC_SUPPORT_EMAIL: optionalString.pipe(z.email().optional()),
});

export interface Brand {
  name: string;
  tagline: string;
  /** Undefined until a real support address is configured; never show a fake one. */
  supportEmail: string | undefined;
}

export const DEFAULT_BRAND = {
  name: "KINORA",
  tagline: "A world where everyone belongs.",
} as const;

export function getBrand(source: Record<string, string | undefined>): Brand {
  const env = parseEnv(brandEnvSchema, source);
  return {
    name: env.NEXT_PUBLIC_BRAND_NAME ?? DEFAULT_BRAND.name,
    tagline: env.NEXT_PUBLIC_BRAND_TAGLINE ?? DEFAULT_BRAND.tagline,
    supportEmail: env.NEXT_PUBLIC_SUPPORT_EMAIL,
  };
}
