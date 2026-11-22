import { buttonVariants, EmptyState, getBrand } from "@kinora/ui";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { PageBody, PageHeader, Section, Steps } from "@/components/site/blocks";
import { entries } from "@/site/messages";
import { pageMetadata } from "@/site/metadata";
import { authRoutes, siteRoutes } from "@/site/routes";

export const generateMetadata = () => pageMetadata("pages.stories", siteRoutes.stories);

export default async function StoriesPage() {
  const brand = getBrand(process.env);
  const v = { brand: brand.name };
  const [t, site] = await Promise.all([getTranslations("pages.stories"), getTranslations("site")]);

  return (
    <>
      <PageHeader title={t("title")} lead={t("lead")} />
      <PageBody>
        <Section id="consent" title={t("consent.title")}>
          <Steps steps={entries(t, "consent.steps", v)} />
        </Section>
        <div className="max-w-[44rem]">
          <EmptyState
            title={t("empty.title")}
            description={t("empty.body")}
            action={
              <Link href={authRoutes.register} className={buttonVariants()}>
                {site("joinBrand", v)}
              </Link>
            }
          />
        </div>
      </PageBody>
    </>
  );
}
