import { describe, expect, it } from "vitest";
import { initials } from "./avatar";

describe("initials", () => {
  it.each([
    ["Amani Wanjiru", "AW"],
    ["amani", "A"],
    ["  Jean-Luc   Moreau  ", "JM"],
    ["Émile Zola", "ÉZ"],
    ["Wambui Njeri Kamau", "WK"],
  ])("%s → %s", (name, expected) => {
    expect(initials(name)).toBe(expected);
  });

  it("returns an empty string for blank names", () => {
    expect(initials("   ")).toBe("");
  });
});
