import { describe, expect, it } from "vitest";
import {
  COUNTRY_CODES,
  InvalidMarketListError,
  parseMarketList,
  registrationAvailability,
} from "./index";

describe("parseMarketList", () => {
  it("normalises case and whitespace and removes duplicates", () => {
    expect([...parseMarketList(" ke, UG ,tz,KE")]).toEqual(["KE", "UG", "TZ"]);
  });

  it("rejects the whole list when any entry is invalid", () => {
    expect(() => parseMarketList("KE,Kenya,U")).toThrow(InvalidMarketListError);
    try {
      parseMarketList("KE,Kenya,U");
    } catch (e) {
      expect((e as InvalidMarketListError).invalidEntries).toEqual(["Kenya", "U"]);
    }
  });

  it("rejects well-formed codes that aren't assigned countries", () => {
    expect(() => parseMarketList("KE,ZZ")).toThrow(InvalidMarketListError);
  });

  it("rejects an empty list", () => {
    expect(() => parseMarketList(" , ")).toThrow(InvalidMarketListError);
  });
});

describe("registrationAvailability", () => {
  const markets = parseMarketList("KE");

  it("opens registration in a launch market", () => {
    expect(registrationAvailability("ke", markets)).toEqual({ status: "open", country: "KE" });
  });

  it("sends other valid countries to the waitlist", () => {
    expect(registrationAvailability("NG", markets)).toEqual({ status: "waitlist", country: "NG" });
  });

  it("flags malformed country input", () => {
    expect(registrationAvailability("Kenya", markets)).toEqual({ status: "invalid_country" });
    expect(registrationAvailability("ZZ", markets)).toEqual({ status: "invalid_country" });
  });

  it("follows configuration rather than code", () => {
    const other = parseMarketList("NG,GH");
    expect(registrationAvailability("NG", other).status).toBe("open");
    expect(registrationAvailability("KE", other).status).toBe("waitlist");
  });
});

describe("COUNTRY_CODES", () => {
  it("lists unique, well-formed codes that the platform can name", () => {
    expect(new Set(COUNTRY_CODES).size).toBe(COUNTRY_CODES.length);
    const names = new Intl.DisplayNames(["en"], { type: "region", fallback: "code" });
    for (const code of COUNTRY_CODES) {
      expect(code).toMatch(/^[A-Z]{2}$/);
      expect(names.of(code), code).not.toBe(code);
    }
  });
});
