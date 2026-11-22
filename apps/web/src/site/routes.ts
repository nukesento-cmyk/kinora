/**
 * Every public page of the website, in one place: the header, footer and sitemap
 * read from here, so a page can't be added to one and forgotten in another.
 * `key` names the label in messages (site.nav.<key>).
 */
export const siteRoutes = {
  home: "/",
  about: "/about",
  discover: "/discover",
  dating: "/dating",
  community: "/community",
  events: "/events",
  stories: "/stories",
  safety: "/safety",
  membership: "/membership",
  help: "/help",
  contact: "/contact",
  privacy: "/privacy",
  terms: "/terms",
  guidelines: "/community-guidelines",
} as const;

export type SiteRouteKey = keyof typeof siteRoutes;

/** Pages owned by the authentication milestone. Linked to, never built here. */
export const authRoutes = { register: "/register", login: "/login" } as const;

export const primaryNav = [
  "discover",
  "dating",
  "community",
  "events",
  "safety",
  "membership",
] as const satisfies readonly SiteRouteKey[];

export const footerNav = {
  explore: ["discover", "dating", "community", "events", "stories"],
  about: ["about", "membership", "safety", "help", "contact"],
  legal: ["privacy", "terms", "guidelines"],
} as const satisfies Record<string, readonly SiteRouteKey[]>;

/** Paths search engines should not crawl. /account arrives with authentication. */
export const disallowedPaths = ["/design", "/account", "/api"] as const;

/** Absolute URL for a site path, based on the configured APP_URL. */
export function absoluteUrl(appUrl: string, path: string): string {
  return new URL(path, appUrl.endsWith("/") ? appUrl : `${appUrl}/`).toString();
}
