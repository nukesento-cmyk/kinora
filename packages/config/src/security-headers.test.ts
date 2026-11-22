import { describe, expect, it } from "vitest";
import { contentSecurityPolicy, securityHeaders } from "./security-headers";

const toMap = (h: ReturnType<typeof securityHeaders>) => new Map(h.map((e) => [e.key, e.value]));

describe("securityHeaders", () => {
  it("blocks framing and browser geolocation", () => {
    const h = toMap(securityHeaders());
    expect(h.get("X-Frame-Options")).toBe("DENY");
    expect(h.get("Content-Security-Policy")).toContain("frame-ancestors 'none'");
    expect(h.get("Permissions-Policy")).toContain("geolocation=()");
  });

  it("adds noindex only when asked", () => {
    expect(toMap(securityHeaders()).has("X-Robots-Tag")).toBe(false);
    expect(toMap(securityHeaders({ noIndex: true })).get("X-Robots-Tag")).toContain("noindex");
  });
});

describe("contentSecurityPolicy", () => {
  const directives = (csp: string) =>
    new Map(
      csp.split("; ").map((d) => {
        const [name, ...values] = d.split(" ");
        return [name, values] as const;
      }),
    );

  it("allows only nonced scripts when a nonce is given", () => {
    const d = directives(contentSecurityPolicy({ nonce: "abc123" }));
    expect(d.get("script-src")).toEqual(["'self'", "'nonce-abc123'", "'strict-dynamic'"]);
    expect(d.get("script-src")).not.toContain("'unsafe-inline'");
    expect(d.get("script-src")).not.toContain("'unsafe-eval'");
    expect(d.get("style-src")).toEqual(["'self'", "'nonce-abc123'"]);
  });

  it("locks down framing, plugins, base URLs and form targets", () => {
    const d = directives(contentSecurityPolicy({ nonce: "n" }));
    expect(d.get("default-src")).toEqual(["'self'"]);
    expect(d.get("frame-ancestors")).toEqual(["'none'"]);
    expect(d.get("object-src")).toEqual(["'none'"]);
    expect(d.get("base-uri")).toEqual(["'self'"]);
    expect(d.get("form-action")).toEqual(["'self'"]);
    expect(d.get("connect-src")).toEqual(["'self'"]);
  });

  it("adds only what's asked for", () => {
    const d = directives(
      contentSecurityPolicy({
        nonce: "n",
        upgradeInsecureRequests: true,
        formActionOrigins: ["https://accounts.google.com"],
      }),
    );
    expect(d.has("upgrade-insecure-requests")).toBe(true);
    expect(d.get("form-action")).toEqual(["'self'", "https://accounts.google.com"]);
    expect(directives(contentSecurityPolicy({ nonce: "n" })).has("upgrade-insecure-requests")).toBe(
      false,
    );
  });

  it("allows eval and inline styles only in development", () => {
    const d = directives(contentSecurityPolicy({ nonce: "n", development: true }));
    expect(d.get("script-src")).toContain("'unsafe-eval'");
    expect(d.get("style-src")).toContain("'unsafe-inline'");
  });

  it("falls back to inline scripts without a nonce, for apps with static pages", () => {
    const d = directives(contentSecurityPolicy());
    expect(d.get("script-src")).toEqual(["'self'", "'unsafe-inline'"]);
  });
});

describe("securityHeaders CSP option", () => {
  it("sends a full policy by default and none when a proxy sets it", () => {
    expect(toMap(securityHeaders()).get("Content-Security-Policy")).toContain("default-src 'self'");
    expect(
      toMap(securityHeaders({ contentSecurityPolicy: false })).has("Content-Security-Policy"),
    ).toBe(false);
  });
});
