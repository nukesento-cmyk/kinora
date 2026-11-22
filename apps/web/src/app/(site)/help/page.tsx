import { getBrand } from "@kinora/ui";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { PageBody, PageHeader, Section } from "@/components/site/blocks";
import { linkClass } from "@/components/site/layout";
import { pageMetadata } from "@/site/metadata";
import { siteRoutes } from "@/site/routes";

export const generateMetadata = () => pageMetadata("pages.help", siteRoutes.help);

type Group = { title: string; questions: { q: string; a: string }[] };

export default async function HelpPage() {
  const brand = getBrand(process.env);
  const v = { brand: brand.name };
  const t = await getTranslations("pages.help");
  const groups = t.raw("groups") as Group[];

  return (
    <>
      <PageHeader title={t("title")} lead={t("lead")} />
      <PageBody>
        {groups.map((group, g) => (
          <Section key={g} id={`faq-${g}`} title={t(`groups.${g}.title`)}>
            <div className="flex max-w-[48rem] flex-col border-t border-line">
              {group.questions.map((_, q) => (
                <details key={q} className="group border-b border-line">
                  <summary className="flex min-h-touch cursor-pointer list-none items-center justify-between gap-4 py-4 text-lg font-[750] [&::-webkit-details-marker]:hidden">
                    {t(`groups.${g}.questions.${q}.q`, v)}
                    <ChevronDown
                      aria-hidden="true"
                      className="size-5 shrink-0 text-ink-muted transition-transform duration-200 ease-kn group-open:rotate-180"
                    />
                  </summary>
                  <p className="max-w-[65ch] pb-5 text-ink-muted">
                    {t(`groups.${g}.questions.${q}.a`, v)}
                  </p>
                </details>
              ))}
            </div>
          </Section>
        ))}
        <p className="text-lg">
          <Link href={siteRoutes.contact} className={linkClass}>
            {t("contactLink")}
          </Link>
        </p>
      </PageBody>
    </>
  );
}
