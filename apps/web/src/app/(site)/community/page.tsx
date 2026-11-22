import { getBrand, Tag } from "@kinora/ui";
import { getTranslations } from "next-intl/server";
import {
  PageBody,
  PageHeader,
  Prose,
  Section,
  StagedNote,
  TermList,
} from "@/components/site/blocks";
import { entries, list } from "@/site/messages";
import { pageMetadata } from "@/site/metadata";
import { siteRoutes } from "@/site/routes";

export const generateMetadata = () => pageMetadata("pages.community", siteRoutes.community);

export default async function CommunityPage() {
  const brand = getBrand(process.env);
  const v = { brand: brand.name };
  const [t, site] = await Promise.all([
    getTranslations("pages.community"),
    getTranslations("site"),
  ]);

  return (
    <>
      <PageHeader title={t("title")} lead={t("lead")} />
      <PageBody>
        <StagedNote title={site("stagedTitle")}>{t("staged")}</StagedNote>
        <Section id="categories" title={t("categories.title")}>
          <ul className="flex max-w-[48rem] flex-wrap gap-2">
            {list(t, "categories.items").map((item) => (
              <li key={item}>
                <Tag className="min-h-10 px-4 text-base">{item}</Tag>
              </li>
            ))}
          </ul>
        </Section>
        <Section id="types" title={t("types.title")}>
          <TermList items={entries(t, "types.items", v)} />
        </Section>
        <Section id="features" title={t("features.title")}>
          <Prose paragraphs={[t("features.body")]} />
        </Section>
        <Section id="moderation" title={t("moderation.title")}>
          <Prose paragraphs={[t("moderation.body")]} />
        </Section>
        <Section id="map" title={t("map.title")}>
          <Prose paragraphs={list(t, "map.body", v)} />
        </Section>
        <Section id="opportunities" title={t("opportunities.title")}>
          <Prose paragraphs={list(t, "opportunities.body", v)} />
        </Section>
      </PageBody>
    </>
  );
}
