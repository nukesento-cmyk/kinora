import { getBrand } from "@kinora/ui";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getServerEnv } from "@/env";
import { footerNav, siteRoutes } from "@/site/routes";
import { BrandMark } from "./brand-mark";
import { Container } from "./layout";

export async function SiteFooter() {
  const brand = getBrand(process.env);
  const { legal } = getServerEnv();
  const t = await getTranslations("site");
  const groups = Object.entries(footerNav) as [keyof typeof footerNav, readonly string[]][];

  return (
    <footer className="mt-24 border-t border-line bg-surface">
      <Container className="grid gap-10 py-12 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="flex flex-col items-start gap-3">
          <BrandMark name={brand.name} label={t("homeLink", { brand: brand.name })} />
          <p className="max-w-[28ch] text-ink-muted">{brand.tagline}</p>
        </div>
        {groups.map(([group, keys]) => (
          <nav key={group} aria-labelledby={`footer-${group}`}>
            <h2 id={`footer-${group}`} className="text-base font-[750]">
              {t(`footer.${group}`, { brand: brand.name })}
            </h2>
            <ul className="mt-2 flex flex-col">
              {keys.map((key) => (
                <li key={key}>
                  <Link
                    href={siteRoutes[key as keyof typeof siteRoutes]}
                    className="inline-flex min-h-touch items-center text-ink-muted hover:text-ink hover:underline"
                  >
                    {t(`nav.${key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </Container>
      <Container className="flex flex-col gap-1 border-t border-line py-6 text-sm text-ink-muted sm:flex-row sm:justify-between">
        <p>
          {t("footer.owner", {
            year: new Date().getFullYear(),
            owner: legal.entityName ?? brand.name,
          })}
        </p>
        <p>{t("footer.drafts")}</p>
      </Container>
    </footer>
  );
}
