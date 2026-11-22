import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";

/** Shell for every public page: skip link, header, the page's <main>, footer. */
export default async function SiteLayout({ children }: { children: ReactNode }) {
  const t = await getTranslations("site");
  return (
    <>
      <a
        href="#content"
        className="sr-only z-50 rounded-control bg-primary px-4 py-3 font-semibold text-on-primary focus:not-sr-only focus:absolute focus:top-3 focus:left-3"
      >
        {t("skipToContent")}
      </a>
      <SiteHeader />
      <main id="content" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
