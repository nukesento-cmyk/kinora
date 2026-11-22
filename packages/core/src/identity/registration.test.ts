import { describe, expect, it } from "vitest";
import { parseMarketList } from "../markets";
import { decideRegistration, safeRedirectPath, validateRegistration } from "./registration";

const now = new Date("2026-11-21T10:00:00Z");
const valid = {
  displayName: "  Amani  ",
  email: " Amani@Example.COM ",
  password: "correct horse",
  dateOfBirth: "1995-03-07",
  countryCode: "ke",
};

describe("validateRegistration", () => {
  it("normalises valid input", () => {
    const r = validateRegistration(valid, now);
    expect(r).toEqual({
      ok: true,
      data: {
        displayName: "Amani",
        email: "amani@example.com",
        password: "correct horse",
        dateOfBirth: "1995-03-07",
        countryCode: "KE",
      },
    });
  });

  it("reports one error code per field", () => {
    const r = validateRegistration(
      { displayName: " ", email: "amani@", password: "short", dateOfBirth: "", countryCode: "" },
      now,
    );
    expect(r).toEqual({
      ok: false,
      errors: {
        displayName: "required",
        email: "invalid",
        password: "too_short",
        dateOfBirth: "required",
        countryCode: "required",
      },
    });
  });

  it("needs a password of at least 10 characters, and caps it", () => {
    expect(validateRegistration({ ...valid, password: "123456789" }, now)).toMatchObject({
      ok: false,
      errors: { password: "too_short" },
    });
    expect(validateRegistration({ ...valid, password: "1234567890" }, now).ok).toBe(true);
    expect(validateRegistration({ ...valid, password: "x".repeat(129) }, now)).toMatchObject({
      errors: { password: "too_long" },
    });
  });

  it("rejects unknown countries and impossible or future dates", () => {
    expect(validateRegistration({ ...valid, countryCode: "ZZ" }, now)).toMatchObject({
      errors: { countryCode: "invalid" },
    });
    expect(validateRegistration({ ...valid, dateOfBirth: "1995-02-30" }, now)).toMatchObject({
      errors: { dateOfBirth: "invalid" },
    });
    expect(validateRegistration({ ...valid, dateOfBirth: "2030-01-01" }, now)).toMatchObject({
      errors: { dateOfBirth: "in_future" },
    });
  });

  it("caps the display name at 50 characters", () => {
    expect(validateRegistration({ ...valid, displayName: "a".repeat(51) }, now)).toMatchObject({
      errors: { displayName: "too_long" },
    });
  });

  it("copes with missing or non-string input", () => {
    expect(validateRegistration(null, now).ok).toBe(false);
    expect(validateRegistration({ ...valid, email: 42 }, now)).toMatchObject({
      errors: { email: "required" },
    });
  });
});

describe("decideRegistration", () => {
  const markets = parseMarketList("KE");

  it("lets adults in a launch market sign up", () => {
    expect(
      decideRegistration({ dateOfBirth: "1995-03-07", countryCode: "KE" }, { markets, now }),
    ).toEqual({ status: "eligible", country: "KE" });
  });

  it("turns away under-18s before considering the country", () => {
    expect(
      decideRegistration({ dateOfBirth: "2008-11-22", countryCode: "KE" }, { markets, now }),
    ).toEqual({ status: "under_age" });
    expect(
      decideRegistration({ dateOfBirth: "2008-11-22", countryCode: "NG" }, { markets, now }),
    ).toEqual({ status: "under_age" });
  });

  it("sends adults elsewhere to the waitlist, following LAUNCH_MARKETS", () => {
    expect(
      decideRegistration({ dateOfBirth: "1995-03-07", countryCode: "NG" }, { markets, now }),
    ).toEqual({ status: "waitlist", country: "NG" });
    expect(
      decideRegistration(
        { dateOfBirth: "1995-03-07", countryCode: "NG" },
        { markets: parseMarketList("NG"), now },
      ).status,
    ).toBe("eligible");
  });
});

describe("safeRedirectPath", () => {
  it("keeps same-site paths and drops anything else", () => {
    expect(safeRedirectPath("/account/security?tab=1", "/x")).toBe("/account/security?tab=1");
    expect(safeRedirectPath("//evil.example", "/x")).toBe("/x");
    expect(safeRedirectPath("/\\evil.example", "/x")).toBe("/x");
    expect(safeRedirectPath("https://evil.example", "/x")).toBe("/x");
    expect(safeRedirectPath("javascript:alert(1)", "/x")).toBe("/x");
    expect(safeRedirectPath(undefined, "/x")).toBe("/x");
  });
});
