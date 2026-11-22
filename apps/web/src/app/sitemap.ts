import type { MetadataRoute } from "next";
import { getServerEnv } from "@/env";
import { absoluteUrl, siteRoutes } from "@/site/routes";

/** Every public page. Registration and sign-in are added by their own milestone. */
export default function sitemap(): MetadataRoute.Sitemap {
  const { APP_URL } = getServerEnv();
  return Object.values(siteRoutes).map((path) => ({
    url: absoluteUrl(APP_URL, path),
    changeFrequency: "monthly",
    priority: path === "/" ? 1 : 0.6,
  }));
}
