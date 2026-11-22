import type { MetadataRoute } from "next";
import { getServerEnv } from "@/env";
import { absoluteUrl, disallowedPaths } from "@/site/routes";

export default function robots(): MetadataRoute.Robots {
  const { APP_URL } = getServerEnv();
  return {
    rules: { userAgent: "*", allow: "/", disallow: [...disallowedPaths] },
    sitemap: absoluteUrl(APP_URL, "/sitemap.xml"),
  };
}
