import { z } from "zod";
import { isKnownCountryCode } from "./countries";

export { COUNTRY_CODES, isKnownCountryCode } from "./countries";

/**
 * Markets domain: which countries registration is open in.
 *
 * Launch markets come from configuration (LAUNCH_MARKETS), never from code,
 * so opening a new country is a config change (idea.md §23: no hardcoded countries).
 */

/** ISO 3166-1 alpha-2 country code, upper case (e.g. "KE"). */
export const countryCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{2}$/, "must be a two-letter ISO 3166-1 alpha-2 code");

export type CountryCode = z.infer<typeof countryCodeSchema>;

export class InvalidMarketListError extends Error {
  constructor(public readonly invalidEntries: string[]) {
    super(`LAUNCH_MARKETS contains invalid country codes: ${invalidEntries.join(", ")}`);
    this.name = "InvalidMarketListError";
  }
}

/**
 * Parse a comma-separated market list such as "KE, ug,TZ".
 * Rejects the whole list if any entry is invalid, so a typo can't silently close a market.
 */
export function parseMarketList(raw: string): ReadonlySet<CountryCode> {
  const entries = raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const invalid: string[] = [];
  const markets = new Set<CountryCode>();
  for (const entry of entries) {
    const parsed = countryCodeSchema.safeParse(entry);
    if (parsed.success && isKnownCountryCode(parsed.data)) markets.add(parsed.data);
    else invalid.push(entry);
  }

  if (invalid.length > 0) throw new InvalidMarketListError(invalid);
  if (markets.size === 0) throw new InvalidMarketListError(["(empty list)"]);
  return markets;
}

export type RegistrationAvailability =
  | { status: "open"; country: CountryCode }
  | { status: "waitlist"; country: CountryCode }
  | { status: "invalid_country" };

/** Decide whether someone in `country` can register now or should join the waitlist. */
export function registrationAvailability(
  country: string,
  markets: ReadonlySet<CountryCode>,
): RegistrationAvailability {
  const parsed = countryCodeSchema.safeParse(country);
  if (!parsed.success || !isKnownCountryCode(parsed.data)) return { status: "invalid_country" };
  return markets.has(parsed.data)
    ? { status: "open", country: parsed.data }
    : { status: "waitlist", country: parsed.data };
}
