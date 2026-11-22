import { getBrand } from "@kinora/ui";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { BulletList, PageBody, PageHeader, Prose, Section } from "@/components/site/blocks";
import { linkClass } from "@/components/site/layout";
import { list } from "@/site/messages";
import { pageMetadata } from "@/site/metadata";
import { siteRoutes } from "@/site/routes";

export const generateMetadata = () => pageMetadata("pages.safety", siteRoutes.safety);

const simple = ["adults", "verification", "identity", "location", "tools"] as const;

export default async function SafetyPage() {
  const brand = getBrand(process.env);
  const v = { brand: brand.name };
  const [t, guidelines] = await Promise.all([
    getTranslations("pages.safety"),
    getTranslations("legal.guidelines.sections"),
  ]);
  const categories = [
    "harassment",
    "hate",
    "objectification",
    "exploitation",
    "impersonation",
    "scams",
    "stalking",
    "threats",
    "images",
    "spam",
  ].map((key) => guidelines(`${key}.title`));

  return (
    <>
      <PageHeader title={t("title", v)} lead={t("lead", v)} />
      <PageBody>
        {simple.map((key) => (
          <Section key={key} id={key} title={t(`${key}.title`)}>
            <Prose paragraphs={[t(`${key}.body`, v)]} />
          </Section>
        ))}
        <Section id="rules" title={t("rules.title")}>
          <p className="max-w-[65ch] text-lg">{t("rules.body")}</p>
          <BulletList items={categories} className="sm:columns-2 sm:block sm:[&>li]:mb-2.5" />
          <Link
            href={siteRoutes.guidelines}
            className={`${linkClass} inline-flex min-h-touch items-center self-start`}
          >
            {t("rules.link")}
          </Link>
        </Section>
        <Section id="messages" title={t("messages.title")}>
          <Prose paragraphs={[t("messages.body")]} />
        </Section>
        <Section id="meeting" title={t("meeting.title")}>
          <BulletList marker="check" items={list(t, "meeting.items", v)} />
        </Section>
        <Section id="danger" title={t("danger.title")}>
          <Prose paragraphs={[t("danger.body")]} />
        </Section>
      </PageBody>
    </>
  );
}
