import { describe, expect, it } from "vitest";
import { contrastRatio } from "./contrast";
import { colorRoles, contrastRequirements, palettes, type Theme } from "./tokens";

describe("contrastRatio", () => {
  it("matches known WCAG values", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 5);
    expect(contrastRatio("#FFFFFF", "#FFFFFF")).toBeCloseTo(1, 5);
    expect(contrastRatio("#767676", "#FFFFFF")).toBeCloseTo(4.54, 2);
  });
});

describe.each(["light", "dark"] satisfies Theme[])("%s palette", (theme) => {
  const palette = palettes[theme];

  it("defines every colour role", () => {
    expect(Object.keys(palette).sort()).toEqual([...colorRoles].sort());
  });

  it.each(contrastRequirements)("$fg on $bg meets $min:1", ({ fg, bg, min }) => {
    const ratio = contrastRatio(palette[fg], palette[bg]);
    expect(
      ratio,
      `${theme}: ${fg} ${palette[fg]} on ${bg} ${palette[bg]} = ${ratio.toFixed(2)}`,
    ).toBeGreaterThanOrEqual(min);
  });
});
