import type { membership } from "@kinora/core";

/** Format a configured plan price for display, e.g. "KES 999" (locale-aware). */
export function formatPrice(price: membership.Price, locale: string): string {
  const { maximumFractionDigits = 2 } = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: price.currency,
  }).resolvedOptions();
  const amount = price.amountMinor / 10 ** maximumFractionDigits;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: price.currency,
    currencyDisplay: "code",
    minimumFractionDigits: Number.isInteger(amount) ? 0 : maximumFractionDigits,
  }).format(amount);
}

/** Localised country name for an ISO code, falling back to the code itself. */
export function countryName(code: string, locale: string): string {
  return new Intl.DisplayNames([locale], { type: "region" }).of(code) ?? code;
}
