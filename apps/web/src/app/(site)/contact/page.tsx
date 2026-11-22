import { cn, getBrand } from "@kinora/ui";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { PageBody, PageHeader, Section } from "@/components/site/blocks";
import { h2Class, linkClass } from "@/components/site/layout";
import { pageMetadata } from "@/site/metadata";
import { siteRoutes } from "@/site/routes";

export const generateMetadata = () => pageMetadata("pages.contact", siteRoutes.contact);

const routes = [
  { key: "help", href: siteRoutes.help },
  { key: "safety", href: siteRoutes.safety },
  { key: "privacy", href: siteRoutes.privacy },
] as const;

export default async function ContactPage() {
  const brand = getBrand(process.env);
  const v = { brand: brand.name };
  const t = await getTranslations("pages.contact");
  const email = brand.supportEmail;

  return (
    <>
      <PageHeader title={t("title")} lead={t("lead")} />
      <PageBody>
        {email ? (
          <Section id="email" title={t("email.title")}>
            <p className="max-w-[65ch] text-lg">
              {t.rich("email.body", {
                email,
                link: (chunks) => (
                  <a className={linkClass} href={`mailto:${email}`}>
                    {chunks}
                  </a>
                ),
              })}
            </p>
          </Section>
        ) : (
          <Section id="email" title={t("noEmail.title")}>
            <p className="max-w-[65ch] text-lg">{t("noEmail.body")}</p>
          </Section>
        )}
        <ul className="grid gap-x-10 gap-y-8 md:grid-cols-3">
          {routes.map(({ key, href }) => (
            <li
              key={key}
              className="flex flex-col items-start gap-2 border-t-[3px] border-ink pt-4"
            >
              <h2 className={cn(h2Class, "text-xl sm:text-xl")}>{t(`${key}.title`, v)}</h2>
              <p className="text-ink-muted">{t(`${key}.body`)}</p>
              <Link href={href} className={`${linkClass} inline-flex min-h-touch items-center`}>
                {t(`${key}.link`)}
              </Link>
            </li>
          ))}
        </ul>
        <p className="max-w-[65ch] text-lg font-semibold">{t("danger")}</p>
      </PageBody>
    </>
  );
}
