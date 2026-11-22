import { z } from "zod";
import { countryCodeSchema, type CountryCode } from "../markets";

/**
 * Membership domain: which plans exist, what each one includes and, only when
 * configured, what it costs (idea.md §17).
 *
 * - Free is the only plan available at launch. Plus and Premium are planned.
 * - Features are stable keys. Their wording lives in the apps' message files.
 * - Prices are never hardcoded. They default to null and come from configuration
 *   (MEMBERSHIP_PRICES), per market, so regional pricing needs no code change.
 */

export const planIds = ["free", "plus", "premium"] as const;
export type PlanId = (typeof planIds)[number];

/** "available": people can have it today. "planned": described, not yet offered. */
export type PlanAvailability = "available" | "planned";

export const planFeatures = {
  free: [
    "account",
    "profile",
    "basicDiscovery",
    "communityParticipation",
    "mutualMatching",
    "messaging",
    "publicEvents",
  ],
  plus: [
    "advancedFilters",
    "expandedDiscovery",
    "incomingLikes",
    "advancedPreferences",
    "customisation",
    "enhancedRecommendations",
  ],
  premium: ["profileBoosts", "advancedDiscovery", "eventBenefits", "personalisation"],
} as const satisfies Record<PlanId, readonly string[]>;

export type PlanFeature = (typeof planFeatures)[PlanId][number];

export interface Price {
  /** ISO 4217 code, e.g. "KES". */
  currency: string;
  /** Amount in the currency's minor unit (cents), to avoid floating point. */
  amountMinor: number;
  interval: "month";
}

export interface Plan {
  id: PlanId;
  availability: PlanAvailability;
  /** The plan whose features this one also includes, if any. */
  includes: PlanId | null;
  /** Features this plan adds on top of `includes`. */
  features: readonly PlanFeature[];
}

export interface PricedPlan extends Plan {
  /** Configured prices by market. A market without an entry has no price to show. */
  prices: Readonly<Partial<Record<CountryCode, Price>>>;
}

export const plans: readonly Plan[] = [
  { id: "free", availability: "available", includes: null, features: planFeatures.free },
  { id: "plus", availability: "planned", includes: "free", features: planFeatures.plus },
  { id: "premium", availability: "planned", includes: "plus", features: planFeatures.premium },
];

const priceSchema = z.object({
  currency: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/, "must be a three-letter ISO 4217 code"),
  amountMinor: z.number().int().positive(),
  interval: z.literal("month").default("month"),
});

/**
 * MEMBERSHIP_PRICES shape: { "<planId>": { "<market>": { currency, amountMinor } } }.
 * Free can't be priced: it's free.
 */
const priceConfigSchema = z
  .object({
    plus: z.record(countryCodeSchema, priceSchema).optional(),
    premium: z.record(countryCodeSchema, priceSchema).optional(),
  })
  .strict();

export type PriceConfig = z.infer<typeof priceConfigSchema>;

export class InvalidPriceConfigError extends Error {
  constructor(public readonly issues: string[]) {
    super(`MEMBERSHIP_PRICES is invalid: ${issues.join("; ")}`);
    this.name = "InvalidPriceConfigError";
  }
}

/** Parse MEMBERSHIP_PRICES. Unset or blank means no prices, which is the default. */
export function parsePriceConfig(raw: string | undefined): PriceConfig {
  if (raw === undefined || raw.trim() === "") return {};
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new InvalidPriceConfigError(["not valid JSON"]);
  }
  const result = priceConfigSchema.safeParse(json);
  if (!result.success) {
    throw new InvalidPriceConfigError(
      result.error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`),
    );
  }
  return result.data;
}

/** Every plan with the prices configured for it, and no others. */
export function resolvePlans(config: PriceConfig = {}): readonly PricedPlan[] {
  return plans.map((plan) => ({
    ...plan,
    prices: plan.id === "free" ? {} : { ...(config[plan.id] ?? {}) },
  }));
}

/** The configured price of a plan in a market, or null when none is configured. */
export function priceFor(plan: PricedPlan, market: CountryCode): Price | null {
  return plan.prices[market] ?? null;
}

/** All features of a plan, including those it inherits, in display order. */
export function allFeatures(planId: PlanId): readonly PlanFeature[] {
  const plan = plans.find((p) => p.id === planId);
  if (!plan) return [];
  return [...(plan.includes ? allFeatures(plan.includes) : []), ...plan.features];
}
