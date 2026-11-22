import { getBrand } from "@kinora/ui";
import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import { connection } from "next/server";
import type { ReactNode } from "react";
import "./globals.css";

export function generateMetadata(): Metadata {
  const brand = getBrand(process.env);
  return {
    // APP_URL is validated at boot (instrumentation.ts); it makes canonical URLs absolute.
    metadataBase: process.env.APP_URL ? new URL(process.env.APP_URL) : undefined,
    title: { default: brand.name, template: `%s | ${brand.name}` },
    description: brand.tagline,
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F3F5F2" },
    { media: "(prefers-color-scheme: dark)", color: "#16121A" },
  ],
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  // Every page renders per request so it can carry the proxy's CSP nonce (src/proxy.ts).
  await connection();
  const locale = await getLocale();
  return (
    <html lang={locale}>
      <body className="min-h-dvh antialiased">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
