import { describe, expect, it } from "vitest";
import { deletionDueAt, isDeletionDue, purgeCutoff } from "./deletion";

describe("deletion grace period", () => {
  const requested = new Date("2026-01-31T15:00:00Z");

  it("falls due exactly graceDays after the request", () => {
    expect(deletionDueAt(requested, 30).toISOString()).toBe("2026-03-02T15:00:00.000Z");
    expect(isDeletionDue(requested, new Date("2026-03-02T14:59:59.999Z"), 30)).toBe(false);
    expect(isDeletionDue(requested, new Date("2026-03-02T15:00:00Z"), 30)).toBe(true);
  });

  it("counts whole 24-hour days across leap days", () => {
    const leap = new Date("2028-02-28T00:00:00Z");
    expect(deletionDueAt(leap, 1).toISOString()).toBe("2028-02-29T00:00:00.000Z");
    expect(deletionDueAt(leap, 2).toISOString()).toBe("2028-03-01T00:00:00.000Z");
  });

  it("gives the purge cutoff as now minus the grace period", () => {
    const now = new Date("2026-03-02T15:00:00Z");
    expect(purgeCutoff(now, 30).toISOString()).toBe(requested.toISOString());
    expect(isDeletionDue(purgeCutoff(now, 7), now, 7)).toBe(true);
  });

  it("rejects a grace period that isn't a positive whole number of days", () => {
    for (const bad of [0, -1, 1.5, Number.NaN]) {
      expect(() => deletionDueAt(requested, bad)).toThrow(RangeError);
      expect(() => purgeCutoff(requested, bad)).toThrow(RangeError);
    }
  });
});
