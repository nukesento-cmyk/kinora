import { getBrand } from "@kinora/ui";
import { getTranslations } from "next-intl/server";
import { PageBody, PageHeader, Prose, Section, TermList } from "@/components/site/blocks";
import { launchMarketList } from "@/site/launch-markets";
import { entries, list } from "@/site/messages";
import { pageMetadata } from "@/site/metadata";
import { siteRoutes } from "@/site/routes";

export const generateMetadata = () => pageMetadata("pages.about", siteRoutes.about);

export default async function AboutPage() {
  const brand = getBrand(process.env);
  const v = { brand: brand.name };
  const [t, site, markets] = await Promise.all([
    getTranslations("pages.about"),
    getTranslations("site"),
    launchMarketList(),
  ]);

  return (
    <>
      <PageHeader title={t("title", v)} lead={t("lead", v)} />
      <PageBody>
        <Section id="mission" title={t("mission.title")}>
          <Prose paragraphs={list(t, "mission.body", v)} />
        </Section>
        <Section id="centre" title={t("centre.title")}>
          <Prose paragraphs={list(t, "centre.body", v)} />
        </Section>
        <Section id="principles" title={t("principles.title")}>
          <TermList items={entries(t, "principles.items", v)} />
        </Section>
        <Section id="markets" title={t("markets.title")}>
          <Prose paragraphs={[site("markets", { markets }), t("markets.body")]} />
        </Section>
      </PageBody>
    </>
  );
}
