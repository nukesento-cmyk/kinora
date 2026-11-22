import { describe, expect, it } from "vitest";
import { ageOn, checkDateOfBirth, dateFromParts, isOldEnough, parseCalendarDate } from "./age";

const at = (iso: string) => new Date(iso);

describe("parseCalendarDate", () => {
  it("accepts real dates and rejects impossible ones", () => {
    expect(parseCalendarDate("2000-02-29")).toEqual({ year: 2000, month: 2, day: 29 });
    expect(parseCalendarDate("1900-02-29")).toBeNull(); // 1900 wasn't a leap year
    expect(parseCalendarDate("2023-02-29")).toBeNull();
    expect(parseCalendarDate("2024-13-01")).toBeNull();
    expect(parseCalendarDate("2024-04-31")).toBeNull();
    expect(parseCalendarDate("24-04-01")).toBeNull();
    expect(parseCalendarDate("2024/04/01")).toBeNull();
    expect(parseCalendarDate("")).toBeNull();
  });
});

describe("dateFromParts", () => {
  it("builds an ISO date from day, month and year inputs", () => {
    expect(dateFromParts("7", "3", "1995")).toBe("1995-03-07");
    expect(dateFromParts(" 07 ", "03", "1995")).toBe("1995-03-07");
    expect(dateFromParts("31", "2", "1995")).toBeNull();
    expect(dateFromParts("1", "1", "95")).toBeNull();
    expect(dateFromParts("", "1", "1995")).toBeNull();
    expect(dateFromParts("1e1", "1", "1995")).toBeNull();
  });
});

describe("ageOn", () => {
  const dob = { year: 2008, month: 6, day: 15 };

  it("counts a birthday only once it has arrived", () => {
    expect(ageOn(dob, at("2026-06-14T23:59:59Z"))).toBe(17);
    expect(ageOn(dob, at("2026-06-15T00:00:00Z"))).toBe(18);
    expect(ageOn(dob, at("2026-12-31T12:00:00Z"))).toBe(18);
  });

  it("uses UTC, not the server's local time zone", () => {
    // 23:30 on the 14th in UTC is already the 15th in Nairobi (UTC+3), but the rule is UTC.
    expect(ageOn(dob, at("2026-06-14T23:30:00Z"))).toBe(17);
    expect(ageOn(dob, at("2026-06-15T00:30:00+03:00"))).toBe(17); // = 14th 21:30 UTC
  });

  it("treats 29 February birthdays as turning a year older on 1 March in common years", () => {
    const leap = { year: 2008, month: 2, day: 29 };
    expect(ageOn(leap, at("2026-02-28T12:00:00Z"))).toBe(17);
    expect(ageOn(leap, at("2026-03-01T00:00:00Z"))).toBe(18);
    // In a leap year the birthday itself exists.
    expect(ageOn({ year: 2010, month: 2, day: 29 }, at("2028-02-28T12:00:00Z"))).toBe(17);
    expect(ageOn({ year: 2010, month: 2, day: 29 }, at("2028-02-29T00:00:00Z"))).toBe(18);
  });
});

describe("checkDateOfBirth", () => {
  const now = at("2026-11-21T10:00:00Z");

  it("accepts someone who turns 18 today", () => {
    expect(checkDateOfBirth("2008-11-21", now)).toEqual({ status: "ok", age: 18 });
    expect(isOldEnough("2008-11-21", now)).toBe(true);
  });

  it("rejects someone who turns 18 tomorrow", () => {
    expect(checkDateOfBirth("2008-11-22", now)).toEqual({ status: "under_age", age: 17 });
    expect(isOldEnough("2008-11-22", now)).toBe(false);
  });

  it("rejects invalid, future and implausibly early dates", () => {
    expect(checkDateOfBirth("2008-02-30", now).status).toBe("invalid");
    expect(checkDateOfBirth("2026-11-22", now).status).toBe("in_future");
    expect(checkDateOfBirth("1899-12-31", now).status).toBe("too_early");
    expect(checkDateOfBirth("1900-01-01", now).status).toBe("ok");
  });

  it("supports a different minimum age", () => {
    expect(checkDateOfBirth("2005-11-22", now, 21).status).toBe("under_age");
  });
});
