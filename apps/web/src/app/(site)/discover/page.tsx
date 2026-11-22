import { getBrand, PersonCard, Tag } from "@kinora/ui";
import { getTranslations } from "next-intl/server";
import {
  BulletList,
  Illustration,
  PageBody,
  PageHeader,
  Prose,
  Section,
  StagedNote,
} from "@/components/site/blocks";
import { list } from "@/site/messages";
import { pageMetadata } from "@/site/metadata";
import { siteRoutes } from "@/site/routes";

export const generateMetadata = () => pageMetadata("pages.discover", siteRoutes.discover);

export default async function DiscoverPage() {
  const brand = getBrand(process.env);
  const v = { brand: brand.name };
  const [t, site] = await Promise.all([getTranslations("pages.discover"), getTranslations("site")]);

  return (
    <>
      <PageHeader
        title={t("title")}
        lead={t("lead")}
        aside={
          <Illustration caption={site("illustration")}>
            <PersonCard name={t("example.name")} meta={t("example.meta")} className="max-w-sm">
              <p className="font-semibold">{t("example.why")}</p>
              <ul className="flex flex-wrap gap-2">
                {list(t, "example.reasons").map((reason) => (
                  <li key={reason}>
                    <Tag tone="shared">{reason}</Tag>
                  </li>
                ))}
              </ul>
            </PersonCard>
          </Illustration>
        }
      />
      <PageBody>
        <StagedNote title={site("stagedTitle")}>{t("staged")}</StagedNote>
        <Section id="what" title={t("what.title")}>
          <BulletList items={list(t, "what.items")} />
        </Section>
        <Section id="filters" title={t("filters.title")}>
          <p className="text-lg">{t("filters.body")}</p>
          <BulletList items={list(t, "filters.items")} />
        </Section>
        <Section id="location" title={t("location.title")}>
          <Prose paragraphs={list(t, "location.body", v)} />
        </Section>
        <Section id="recommendations" title={t("recommendations.title")}>
          <Prose paragraphs={list(t, "recommendations.body", v)} />
        </Section>
      </PageBody>
    </>
  );
}
