import { membership } from "@kinora/core";
import { buttonVariants, cn, getBrand } from "@kinora/ui";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { BulletList, PageBody, PageHeader, Prose, Section } from "@/components/site/blocks";
import { getServerEnv } from "@/env";
import { countryName, formatPrice } from "@/site/format";
import { pageMetadata } from "@/site/metadata";
import { authRoutes, siteRoutes } from "@/site/routes";

export const generateMetadata = () => pageMetadata("pages.membership", siteRoutes.membership);

export default async function MembershipPage() {
  const brand = getBrand(process.env);
  const v = { brand: brand.name };
  const { membershipPlans, launchMarkets } = getServerEnv();
  const [t, locale] = await Promise.all([getTranslations("pages.membership"), getLocale()]);
  const feature = (key: membership.PlanFeature) => t(`features.${key}`);

  const [free, ...later] = membershipPlans;
  if (!free) return null;

  /** Only prices that are configured for an open market are shown. */
  const prices = (plan: membership.PricedPlan) =>
    [...launchMarkets].flatMap((market) => {
      const price = membership.priceFor(plan, market);
      return price
        ? [
            t("price", {
              price: formatPrice(price, locale),
              market: countryName(market, locale),
            }),
          ]
        : [];
    });

  return (
    <>
      <PageHeader title={t("title")} lead={t("lead", v)} />
      <PageBody>
        <section
          aria-labelledby="plan-free"
          className="grid gap-8 rounded-person border-[3px] border-primary bg-surface p-6 sm:p-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16"
        >
          <div className="flex flex-col items-start gap-3">
            <p className="font-semibold text-primary-ink">{t("available")}</p>
            <h2 id="plan-free" className="text-3xl font-[850] tracking-[-0.03em]">
              {t("free.name")}
            </h2>
            <p className="text-lg text-ink-muted">{t("free.body")}</p>
            <Link href={authRoutes.register} className={cn(buttonVariants(), "mt-2")}>
              {t("free.cta")}
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            <h3 className="text-lg font-[750]">{t("includes")}</h3>
            <BulletList marker="check" items={free.features.map(feature)} />
          </div>
        </section>

        <div className="grid gap-10 md:grid-cols-2 md:gap-12">
          {later.map((plan) => {
            const shown = prices(plan);
            const parent = membershipPlans.find((p) => p.id === plan.includes);
            return (
              <section
                key={plan.id}
                aria-labelledby={`plan-${plan.id}`}
                className="flex flex-col gap-4 border-t border-line-strong pt-6"
              >
                <p className="font-semibold text-ink-muted">{t("planned")}</p>
                <h2 id={`plan-${plan.id}`} className="text-2xl font-[800] tracking-[-0.03em]">
                  {t(`${plan.id}.name`, v)}
                </h2>
                <p className="text-lg text-ink-muted">{t(`${plan.id}.body`, v)}</p>
                {shown.length ? (
                  <ul className="flex flex-col gap-1 font-semibold">
                    {shown.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="font-semibold">{t("noPrice")}</p>
                )}
                {parent ? <p>{t("everythingIn", { plan: t(`${parent.id}.name`, v) })}</p> : null}
                <BulletList items={plan.features.map(feature)} />
                <p className="text-sm text-ink-muted">{t("plannedNote")}</p>
              </section>
            );
          })}
        </div>

        <Section id="safety" title={t("safety.title")}>
          <Prose paragraphs={[t("safety.body")]} />
        </Section>
        <Section id="payments" title={t("payments.title")}>
          <Prose paragraphs={[t("payments.body")]} />
        </Section>
      </PageBody>
    </>
  );
}
