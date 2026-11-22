import { securityHeaders } from "@kinora/config";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  transpilePackages: ["@kinora/config", "@kinora/core", "@kinora/ui"],
  async headers() {
    // The Content-Security-Policy is set per request, with a nonce, by src/proxy.ts.
    return [{ source: "/:path*", headers: securityHeaders({ contentSecurityPolicy: false }) }];
  },
};

export default withNextIntl(nextConfig);
