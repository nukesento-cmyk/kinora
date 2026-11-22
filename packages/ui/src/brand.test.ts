import { EnvValidationError } from "@kinora/config";
import { describe, expect, it } from "vitest";
import { DEFAULT_BRAND, getBrand } from "./brand";

describe("getBrand", () => {
  it("falls back to defaults when nothing is configured", () => {
    expect(getBrand({})).toEqual({ ...DEFAULT_BRAND, supportEmail: undefined });
  });

  it("uses configured values, ignoring blank ones", () => {
    const brand = getBrand({
      NEXT_PUBLIC_BRAND_NAME: "Kin",
      NEXT_PUBLIC_BRAND_TAGLINE: " ",
      NEXT_PUBLIC_SUPPORT_EMAIL: "help@example.org",
    });
    expect(brand.name).toBe("Kin");
    expect(brand.tagline).toBe(DEFAULT_BRAND.tagline);
    expect(brand.supportEmail).toBe("help@example.org");
  });

  it("rejects a malformed support email", () => {
    expect(() => getBrand({ NEXT_PUBLIC_SUPPORT_EMAIL: "nope" })).toThrow(EnvValidationError);
  });
});
