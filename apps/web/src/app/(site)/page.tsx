import { membership } from "@kinora/core";
import { buttonVariants, cn, getBrand } from "@kinora/ui";
import { Check } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { BulletList, Illustration, Steps } from "@/components/site/blocks";
import { Horizon } from "@/components/site/horizon";
import { Container, h1Class, h2Class, linkClass } from "@/components/site/layout";
import { MatchPreview } from "@/components/site/match-preview";
import { launchMarketList } from "@/site/launch-markets";
import { entries, list } from "@/site/messages";
import { authRoutes, siteRoutes } from "@/site/routes";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("home");
  return { description: t("meta.description"), alternates: { canonical: "/" } };
}

// Invented people for the illustrations, labelled as such wherever they appear.
const horizonPeople = [
  { name: "Leila Haddad", wide: true },
  { name: "Chidi Okafor" },
  { name: "Wanjiru Kamau", ring: "connection" as const },
  { name: "Tomás Ruiz", ring: "connection" as const },
  { name: "Jonas Berg", wide: true },
  { name: "Mei Lin", ring: "new" as const },
  { name: "Amani Otieno" },
];

const experiences = [
  { key: "dating", href: siteRoutes.dating },
  { key: "friendship", href: siteRoutes.discover },
  { key: "community", href: siteRoutes.community },
  { key: "events", href: siteRoutes.events },
  { key: "opportunities", href: `${siteRoutes.community}#opportunities` },
] as const;

export default async function HomePage() {
  const brand = getBrand(process.env);
  const v = { brand: brand.name };
  const [t, site, features, markets] = await Promise.all([
    getTranslations("home"),
    getTranslations("site"),
    getTranslations("pages.membership.features"),
    launchMarketList(),
  ]);

  return (
    <>
      {/* What it is, who it's for, and the way in. */}
      <section aria-labelledby="hero-title" className="overflow-hidden">
        <Container className="flex flex-col gap-6 pt-10 sm:pt-16 lg:grid lg:grid-cols-[1.3fr_1fr] lg:items-end lg:gap-16">
          <h1 id="hero-title" className={`${h1Class} max-w-[17ch]`}>
            {t("title")}
          </h1>
          <div className="flex flex-col gap-5">
            <p className="text-lg text-ink-muted sm:text-xl">{t("building", v)}</p>
            <div className="flex flex-wrap gap-3">
              <Link href={authRoutes.register} className={buttonVariants()}>
                {site("joinBrand", v)}
              </Link>
              <Link href="#how" className={buttonVariants({ variant: "secondary" })}>
                {t("howLink")}
              </Link>
            </div>
            <p className="font-semibold">{t("markets", { markets })}</p>
          </div>
        </Container>
        <figure className="mt-12 flex flex-col gap-4 sm:mt-16">
          <Horizon
            people={horizonPeople}
            labels={{ connected: t("horizon.connected"), new: t("horizon.new") }}
          />
          <Container>
            <figcaption className="text-sm text-ink-muted">{site("illustration")}</figcaption>
          </Container>
        </figure>
      </section>

      {/* Who it serves. */}
      <Container className="mt-24 grid gap-8 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
        <section aria-labelledby="who-title" className="contents">
          <div className="flex flex-col gap-3">
            <h2 id="who-title" className={h2Class}>
              {t("who.title")}
            </h2>
            <p className="max-w-[32ch] text-lg text-ink-muted">{t("who.intro")}</p>
          </div>
          <ul className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {entries(t, "who.items", v).map((item) => (
              <li key={item.title} className="flex flex-col gap-1.5 border-t-[3px] border-ink pt-4">
                <h3 className="text-lg font-[750]">{item.title}</h3>
                <p className="text-ink-muted">{item.body}</p>
              </li>
            ))}
          </ul>
        </section>
      </Container>

      {/* Why it exists. */}
      <Container className="mt-24">
        <section aria-labelledby="why-title" className="flex flex-col gap-6">
          <h2 id="why-title" className={h2Class}>
            {t("why.title")}
          </h2>
          <p className="max-w-[38ch] text-2xl font-semibold tracking-[-0.015em] sm:text-3xl">
            {t("why.statement", v)}
          </p>
          <p className="max-w-[62ch] text-lg text-ink-muted">{t("why.body", v)}</p>
        </section>
      </Container>

      {/* How people connect. */}
      <Container className="mt-24">
        <section
          id="how"
          aria-labelledby="how-title"
          className="grid scroll-mt-6 gap-10 lg:grid-cols-[1.3fr_1fr] lg:items-center lg:gap-16"
        >
          <div className="flex flex-col gap-8">
            <h2 id="how-title" className={h2Class}>
              {t("how.title")}
            </h2>
            <Steps steps={entries(t, "how.steps", v)} />
          </div>
          <Illustration caption={site("illustration")}>
            <MatchPreview
              name={t("how.matchName")}
              meta={t("how.matchMeta")}
              ringLabel={t("horizon.connected")}
              intention={t("how.matchIntention")}
              sharedLabel={t("how.matchShared")}
              interests={list(t, "how.matchInterests")}
            />
          </Illustration>
        </section>
      </Container>

      {/* The experiences. */}
      <Container className="mt-24">
        <section aria-labelledby="experiences-title" className="flex flex-col gap-6">
          <h2 id="experiences-title" className={h2Class}>
            {t("experiences.title")}
          </h2>
          <p className="max-w-[62ch] text-lg text-ink-muted">{t("experiences.intro", v)}</p>
          <ul className="mt-2 flex flex-col">
            {experiences.map(({ key, href }) => (
              <li
                key={key}
                className="grid gap-1 border-t border-line py-5 sm:grid-cols-[12rem_1fr_auto] sm:items-baseline sm:gap-8"
              >
                <h3 className="text-xl font-[800] tracking-[-0.02em]">
                  {t(`experiences.${key}.title`)}
                </h3>
                <p className="text-ink-muted">{t(`experiences.${key}.body`)}</p>
                <Link href={href} className={`${linkClass} inline-flex min-h-touch items-center`}>
                  {t("experiences.more", { topic: t(`experiences.${key}.title`).toLowerCase() })}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </Container>

      {/* Safety and inclusion: the one inverted band on the page. */}
      <Container className="mt-24">
        <section
          data-theme="dark"
          aria-labelledby="safety-title"
          className="grid gap-8 rounded-person bg-surface p-6 text-ink sm:p-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16 lg:p-14"
        >
          <div className="flex flex-col items-start gap-4">
            <h2 id="safety-title" className={h2Class}>
              {t("safety.title")}
            </h2>
            <p className="text-lg text-ink-muted">{t("safety.body", v)}</p>
            <Link
              href={siteRoutes.safety}
              className={`${linkClass} inline-flex min-h-touch items-center`}
            >
              {t("safety.link")}
            </Link>
          </div>
          <BulletList marker="check" items={list(t, "safety.items")} />
        </section>
      </Container>

      {/* Membership benefits. */}
      <Container className="mt-24">
        <section
          aria-labelledby="membership-title"
          className="grid gap-8 lg:grid-cols-[1fr_1.4fr] lg:gap-16"
        >
          <div className="flex flex-col items-start gap-4">
            <h2 id="membership-title" className={h2Class}>
              {t("membership.title")}
            </h2>
            <p className="text-lg text-ink-muted">{t("membership.body")}</p>
          </div>
          <div className="flex flex-col gap-6">
            <ul className="grid gap-x-8 gap-y-3 text-lg sm:grid-cols-2">
              {membership.allFeatures("free").map((key) => (
                <li key={key} className="flex gap-3">
                  <Check aria-hidden="true" className="mt-1 size-5 shrink-0 text-primary-ink" />
                  <span>{features(key)}</span>
                </li>
              ))}
            </ul>
            <p className="max-w-[60ch] text-ink-muted">{t("membership.later")}</p>
            <Link
              href={siteRoutes.membership}
              className={`${linkClass} inline-flex min-h-touch items-center self-start`}
            >
              {t("membership.link")}
            </Link>
          </div>
        </section>
      </Container>

      {/* The registration call to action. */}
      <Container className="mt-28">
        <section
          aria-labelledby="cta-title"
          className="flex flex-col items-start gap-6 border-t-[3px] border-primary pt-10 sm:flex-row sm:items-end sm:justify-between"
        >
          <div className="flex max-w-[36rem] flex-col gap-4">
            <h2 id="cta-title" className={cn(h1Class, "text-3xl sm:text-4xl")}>
              {t("cta.title")}
            </h2>
            <p className="text-lg text-ink-muted">{t("cta.body")}</p>
            <p className="font-semibold">{t("markets", { markets })}</p>
          </div>
          <Link href={authRoutes.register} className={buttonVariants({ className: "px-8" })}>
            {site("joinBrand", v)}
          </Link>
        </section>
      </Container>
    </>
  );
}
