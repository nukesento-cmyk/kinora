import "server-only";
import { getFormatter, getLocale } from "next-intl/server";
import { getServerEnv } from "@/env";
import { countryName } from "./format";

/** The configured launch markets as a sentence-ready list, e.g. "Kenya and Uganda". */
export async function launchMarketList(): Promise<string> {
  const { launchMarkets } = getServerEnv();
  const [format, locale] = await Promise.all([getFormatter(), getLocale()]);
  return format.list(
    [...launchMarkets].map((code) => countryName(code, locale)),
    { type: "conjunction" },
  );
}
