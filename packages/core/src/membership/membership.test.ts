import { describe, expect, it } from "vitest";
import {
  allFeatures,
  InvalidPriceConfigError,
  parsePriceConfig,
  planFeatures,
  planIds,
  plans,
  priceFor,
  resolvePlans,
} from "./index";

describe("membership plans", () => {
  it("defines free, plus and premium in that order", () => {
    expect(plans.map((p) => p.id)).toEqual([...planIds]);
  });

  it("offers only free membership at launch", () => {
    expect(plans.filter((p) => p.availability === "available").map((p) => p.id)).toEqual(["free"]);
    expect(plans.find((p) => p.id === "plus")?.availability).toBe("planned");
    expect(plans.find((p) => p.id === "premium")?.availability).toBe("planned");
  });

  it("gives free members the idea.md §17 basics", () => {
    expect(allFeatures("free")).toEqual([
      "account",
      "profile",
      "basicDiscovery",
      "communityParticipation",
      "mutualMatching",
      "messaging",
      "publicEvents",
    ]);
  });

  it("builds each tier on the one below it", () => {
    expect(allFeatures("plus")).toEqual([...planFeatures.free, ...planFeatures.plus]);
    expect(allFeatures("premium")).toEqual([
      ...planFeatures.free,
      ...planFeatures.plus,
      ...planFeatures.premium,
    ]);
  });

  it("has no feature listed in two tiers", () => {
    const all = [...planFeatures.free, ...planFeatures.plus, ...planFeatures.premium];
    expect(new Set(all).size).toBe(all.length);
  });
});

describe("membership prices", () => {
  it("has no prices unless configured", () => {
    for (const plan of resolvePlans()) {
      expect(plan.prices).toEqual({});
      expect(priceFor(plan, "KE")).toBeNull();
    }
    expect(parsePriceConfig(undefined)).toEqual({});
    expect(parsePriceConfig("  ")).toEqual({});
  });

  it("shows a configured price only in its own market", () => {
    const config = parsePriceConfig(
      JSON.stringify({ plus: { ke: { currency: "kes", amountMinor: 99_900 } } }),
    );
    const plus = resolvePlans(config).find((p) => p.id === "plus")!;
    expect(priceFor(plus, "KE")).toEqual({
      currency: "KES",
      amountMinor: 99_900,
      interval: "month",
    });
    expect(priceFor(plus, "NG")).toBeNull();
    const premium = resolvePlans(config).find((p) => p.id === "premium")!;
    expect(priceFor(premium, "KE")).toBeNull();
  });

  it("never prices the free plan", () => {
    expect(() =>
      parsePriceConfig(JSON.stringify({ free: { KE: { currency: "KES", amountMinor: 1 } } })),
    ).toThrow(InvalidPriceConfigError);
  });

  it.each([
    ["not JSON", "{plus"],
    ["bad currency", JSON.stringify({ plus: { KE: { currency: "KSH1", amountMinor: 100 } } })],
    ["fractional amount", JSON.stringify({ plus: { KE: { currency: "KES", amountMinor: 9.5 } } })],
    ["zero amount", JSON.stringify({ plus: { KE: { currency: "KES", amountMinor: 0 } } })],
    ["bad market", JSON.stringify({ plus: { Kenya: { currency: "KES", amountMinor: 100 } } })],
  ])("rejects %s", (_label, raw) => {
    expect(() => parsePriceConfig(raw)).toThrow(InvalidPriceConfigError);
  });
});
