import { describe, expect, it } from "vitest";
import { isDesignPreviewEnabled } from "./design-preview";

describe("isDesignPreviewEnabled", () => {
  it("is off by default and for anything but exactly 'true'", () => {
    expect(isDesignPreviewEnabled({})).toBe(false);
    expect(isDesignPreviewEnabled({ ENABLE_DESIGN_PREVIEW: "1" })).toBe(false);
    expect(isDesignPreviewEnabled({ ENABLE_DESIGN_PREVIEW: "TRUE" })).toBe(false);
  });

  it("turns on only with 'true'", () => {
    expect(isDesignPreviewEnabled({ ENABLE_DESIGN_PREVIEW: "true" })).toBe(true);
  });
});
