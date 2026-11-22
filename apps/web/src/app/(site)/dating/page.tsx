import { getBrand } from "@kinora/ui";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  BulletList,
  Illustration,
  PageBody,
  PageHeader,
  Prose,
  Section,
  StagedNote,
  Steps,
} from "@/components/site/blocks";
import { linkClass } from "@/components/site/layout";
import { MatchPreview } from "@/components/site/match-preview";
import { entries, list } from "@/site/messages";
import { pageMetadata } from "@/site/metadata";
import { siteRoutes } from "@/site/routes";

export const generateMetadata = () => pageMetadata("pages.dating", siteRoutes.dating);

export default async function DatingPage() {
  const brand = getBrand(process.env);
  const v = { brand: brand.name };
  const [t, site, home] = await Promise.all([
    getTranslations("pages.dating"),
    getTranslations("site"),
    getTranslations("home"),
  ]);

  return (
    <>
      <PageHeader
        title={t("title")}
        lead={t("lead")}
        aside={
          <Illustration caption={site("illustration")}>
            <MatchPreview
              name={t("example.name")}
              meta={t("example.meta")}
              ringLabel={t("example.matched")}
              intention={t("example.intention")}
              sharedLabel={home("how.matchShared")}
              interests={list(home, "how.matchInterests")}
            />
          </Illustration>
        }
      />
      <PageBody>
        <StagedNote title={site("stagedTitle")}>{t("staged")}</StagedNote>
        <Section id="intentions" title={t("intentions.title")}>
          <p className="text-lg">{t("intentions.body")}</p>
          <BulletList items={list(t, "intentions.items")} />
        </Section>
        <Section id="how" title={t("how.title")}>
          <Steps steps={entries(t, "how.steps", v)} />
        </Section>
        <Section id="respect" title={t("respect.title")}>
          <Prose paragraphs={list(t, "respect.body", v)} />
          <Link
            href={siteRoutes.guidelines}
            className={`${linkClass} inline-flex min-h-touch items-center self-start`}
          >
            {t("respect.link")}
          </Link>
        </Section>
      </PageBody>
    </>
  );
}
