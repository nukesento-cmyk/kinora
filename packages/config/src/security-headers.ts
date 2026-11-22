export interface ContentSecurityPolicyOptions {
  /**
   * Per-request nonce (base64). With a nonce, only scripts carrying it, and scripts
   * they load, can run ('strict-dynamic'). Next.js adds it to its own scripts when the
   * nonce is in the request's CSP header (set by the app's proxy).
   * Without one the policy falls back to 'self' 'unsafe-inline' for scripts, for apps
   * whose pages are static and have no proxy.
   */
  nonce?: string;
  /** Development server: React needs eval for debugging and injects styles without a nonce. */
  development?: boolean;
  /** Add upgrade-insecure-requests. Only for sites served over HTTPS. */
  upgradeInsecureRequests?: boolean;
  /** Extra origins forms may submit or redirect to, e.g. an OAuth provider. */
  formActionOrigins?: readonly string[];
}

/** Build a Content-Security-Policy that works with Next.js. */
export function contentSecurityPolicy(options: ContentSecurityPolicyOptions = {}): string {
  const { nonce, development = false, upgradeInsecureRequests = false } = options;
  const scriptSrc = nonce
    ? ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'"]
    : ["'self'", "'unsafe-inline'"];
  if (development) scriptSrc.push("'unsafe-eval'");
  const styleSrc =
    nonce && !development ? ["'self'", `'nonce-${nonce}'`] : ["'self'", "'unsafe-inline'"];

  const directives: [string, ...string[]][] = [
    ["default-src", "'self'"],
    ["script-src", ...scriptSrc],
    ["style-src", ...styleSrc],
    // style="" attributes (e.g. computed widths) can't carry a nonce.
    ["style-src-attr", "'unsafe-inline'"],
    ["img-src", "'self'", "data:", "blob:"],
    ["font-src", "'self'"],
    ["connect-src", "'self'"],
    ["media-src", "'self'"],
    ["worker-src", "'self'", "blob:"],
    ["manifest-src", "'self'"],
    ["frame-src", "'none'"],
    ["object-src", "'none'"],
    ["base-uri", "'self'"],
    ["form-action", "'self'", ...(options.formActionOrigins ?? [])],
    ["frame-ancestors", "'none'"],
  ];
  if (upgradeInsecureRequests) directives.push(["upgrade-insecure-requests"]);
  return directives.map((d) => d.join(" ")).join("; ");
}

export interface SecurityHeaderOptions {
  /** Ask search engines not to index (used by the staff app). */
  noIndex?: boolean;
  /**
   * Content-Security-Policy for every route. Defaults to the nonce-less policy.
   * Pass false when a proxy sets a per-request nonce policy instead (the member app).
   */
  contentSecurityPolicy?: string | false;
}

export interface HeaderEntry {
  key: string;
  value: string;
}

/** Baseline HTTP security headers applied to every route of every app. */
export function securityHeaders(options: SecurityHeaderOptions = {}): HeaderEntry[] {
  const csp = options.contentSecurityPolicy ?? contentSecurityPolicy();
  const headers: HeaderEntry[] = [
    { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    ...(csp ? [{ key: "Content-Security-Policy", value: csp }] : []),
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    // Location is never read from the browser: discovery uses coarse, member-entered places.
    { key: "Permissions-Policy", value: "geolocation=(), camera=(), microphone=(), payment=()" },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ];
  if (options.noIndex) {
    headers.push({ key: "X-Robots-Tag", value: "noindex, nofollow" });
  }
  return headers;
}
