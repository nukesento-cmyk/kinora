import { describe, expect, it } from "vitest";
import { countryName, formatPrice } from "./format";

const space = (s: string) => s.replace(/\s/g, " ");

describe("formatPrice", () => {
  it("converts minor units using the currency's own decimals", () => {
    expect(
      space(formatPrice({ currency: "KES", amountMinor: 99_900, interval: "month" }, "en")),
    ).toBe("KES 999");
    expect(space(formatPrice({ currency: "USD", amountMinor: 799, interval: "month" }, "en"))).toBe(
      "USD 7.99",
    );
  });

  it("handles currencies without minor units", () => {
    expect(
      space(formatPrice({ currency: "JPY", amountMinor: 1200, interval: "month" }, "en")),
    ).toBe("JPY 1,200");
  });
});

describe("countryName", () => {
  it("names a country in the given locale", () => {
    expect(countryName("KE", "en")).toBe("Kenya");
  });
});
