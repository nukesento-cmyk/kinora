import "server-only";
import { authEnvSchema, parseEnv, sharedEnvSchema, shouldUseSecureCookies } from "@kinora/config";
import { parseMarketList } from "@kinora/core/markets";
import { parsePriceConfig, resolvePlans } from "@kinora/core/membership";
import { getBrand } from "@kinora/ui";
import { getLegalConfig } from "./site/legal-config";

/** Validated server environment for the member app. Import from server code only. */
export function getServerEnv() {
  const env = parseEnv(sharedEnvSchema, process.env);
  const brand = getBrand(process.env);
  return {
    ...env,
    brand,
    launchMarkets: parseMarketList(env.LAUNCH_MARKETS),
    legal: getLegalConfig(process.env, brand.supportEmail),
    membershipPlans: resolvePlans(parsePriceConfig(process.env.MEMBERSHIP_PRICES)),
  };
}

/**
 * Sign-in, email and deletion settings. Read at runtime (never during the build), so
 * NODE_ENV here is the server's real environment.
 */
export function getAuthEnv() {
  const env = parseEnv(authEnvSchema, process.env);
  return {
    ...env,
    secureCookies: shouldUseSecureCookies(env),
    google:
      env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
        ? { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET }
        : undefined,
  };
}
