import { buttonVariants, EmptyState, getBrand } from "@kinora/ui";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  BulletList,
  PageBody,
  PageHeader,
  Prose,
  Section,
  StagedNote,
} from "@/components/site/blocks";
import { linkClass } from "@/components/site/layout";
import { list } from "@/site/messages";
import { pageMetadata } from "@/site/metadata";
import { authRoutes, siteRoutes } from "@/site/routes";

export const generateMetadata = () => pageMetadata("pages.events", siteRoutes.events);

export default async function EventsPage() {
  const brand = getBrand(process.env);
  const v = { brand: brand.name };
  const [t, site] = await Promise.all([getTranslations("pages.events"), getTranslations("site")]);

  return (
    <>
      <PageHeader title={t("title")} lead={t("lead")} />
      <PageBody>
        <StagedNote title={site("stagedTitle")}>{t("staged")}</StagedNote>
        <Section id="kinds" title={t("kinds.title")}>
          <Prose paragraphs={list(t, "kinds.body", v)} />
        </Section>
        <Section id="safety" title={t("safety.title")}>
          <BulletList marker="check" items={list(t, "safety.items")} />
          <Link
            href={`${siteRoutes.safety}#meeting`}
            className={`${linkClass} inline-flex min-h-touch items-center self-start`}
          >
            {t("safety.link")}
          </Link>
        </Section>
        <section aria-labelledby="events-empty" className="max-w-[44rem]">
          <EmptyState
            title={<span id="events-empty">{t("empty.title")}</span>}
            description={t("empty.body")}
            action={
              <Link href={authRoutes.register} className={buttonVariants()}>
                {site("joinBrand", v)}
              </Link>
            }
          />
        </section>
      </PageBody>
    </>
  );
}
