import { securityHeaders } from "@kinora/config";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  transpilePackages: ["@kinora/config", "@kinora/core", "@kinora/ui"],
  async headers() {
    // The staff app must never appear in search results.
    return [{ source: "/:path*", headers: securityHeaders({ noIndex: true }) }];
  },
};

export default withNextIntl(nextConfig);
