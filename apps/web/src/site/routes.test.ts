import { describe, expect, it } from "vitest";
import { absoluteUrl, footerNav, primaryNav, siteRoutes } from "./routes";

describe("site routes", () => {
  it("lists every public page from idea.md §7 except registration and login", () => {
    expect(Object.keys(siteRoutes)).toHaveLength(14);
    expect(Object.values(siteRoutes)).not.toContain("/register");
    expect(Object.values(siteRoutes)).not.toContain("/login");
  });

  it("links every page except home from the footer", () => {
    const linked = new Set<string>(Object.values(footerNav).flat());
    for (const key of Object.keys(siteRoutes)) {
      if (key !== "home") expect(linked.has(key), key).toBe(true);
    }
    for (const key of primaryNav) expect(siteRoutes[key]).toMatch(/^\/[a-z-]+$/);
  });

  it("builds absolute URLs with or without a trailing slash", () => {
    expect(absoluteUrl("https://example.com", "/about")).toBe("https://example.com/about");
    expect(absoluteUrl("https://example.com/", "/")).toBe("https://example.com/");
  });
});
