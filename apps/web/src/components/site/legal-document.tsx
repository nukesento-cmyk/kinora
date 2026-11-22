import { Alert, getBrand } from "@kinora/ui";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { getServerEnv } from "@/env";
import { list } from "@/site/messages";
import { BulletList, Prose, Section } from "./blocks";
import { Container, h1Class, linkClass } from "./layout";

interface LegalSection {
  title: string;
  paragraphs?: string[];
  items?: string[];
  after?: string[];
}

/**
 * Renders a legal draft from messages (legal.<doc>.sections), in the order the sections
 * are written. Sections named "operator" and "contact" get the configured company and
 * privacy contact, or a clear "to be confirmed" note when they aren't configured yet.
 */
export async function LegalDocument({ doc }: { doc: "privacy" | "terms" | "guidelines" }) {
  const brand = getBrand(process.env);
  const { legal } = getServerEnv();
  const t = await getTranslations("legal");
  const v = { brand: brand.name };
  const base = `${doc}.sections`;
  const sections = Object.entries(t.raw(base) as Record<string, LegalSection>);

  const operator: ReactNode = legal.entityName ? (
    <Prose
      paragraphs={[
        t("operator", { ...v, entity: legal.entityName }),
        ...(legal.address ? [t("address", { address: legal.address })] : []),
      ]}
    />
  ) : (
    <Alert tone="warning" title={t("operatorTbc", v)} className="max-w-[65ch]" />
  );

  const contact: ReactNode = legal.privacyEmail ? (
    <p className="max-w-[65ch] text-lg">
      {t.rich("privacyContact", {
        email: legal.privacyEmail,
        link: (chunks) => (
          <a className={linkClass} href={`mailto:${legal.privacyEmail}`}>
            {chunks}
          </a>
        ),
      })}
    </p>
  ) : (
    <Alert tone="warning" title={t("privacyContactTbc")} className="max-w-[65ch]" />
  );

  const slots: Record<string, ReactNode> = { operator, contact };

  return (
    <Container className="grid gap-10 pt-10 lg:grid-cols-[15rem_1fr] lg:gap-16">
      <div className="flex flex-col gap-6 lg:col-span-2">
        <Alert tone="warning" title={t("draft.title")} className="max-w-[44rem]">
          {t("draft.body", v)}
        </Alert>
        <h1 className={h1Class}>{t(`${doc}.title`, v)}</h1>
        <p className="max-w-[44rem] text-lg text-ink-muted sm:text-xl">{t(`${doc}.lead`, v)}</p>
      </div>

      <nav aria-labelledby="toc-title" className="lg:sticky lg:top-6 lg:self-start">
        <h2 id="toc-title" className="text-base font-[750]">
          {(await getTranslations("site"))("onThisPage")}
        </h2>
        <ol className="mt-2 flex flex-col border-l border-line">
          {sections.map(([id]) => (
            <li key={id}>
              <a
                href={`#${id}`}
                className="-ml-px inline-flex min-h-touch items-center border-l-2 border-transparent pl-4 text-ink-muted hover:border-primary hover:text-ink"
              >
                {t(`${base}.${id}.title`, v)}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="flex min-w-0 flex-col gap-12">
        {sections.map(([id, section]) => (
          <Section key={id} id={id} title={t(`${base}.${id}.title`, v)}>
            {section.paragraphs?.length ? (
              <Prose paragraphs={list(t, `${base}.${id}.paragraphs`, v)} />
            ) : null}
            {slots[id] ?? null}
            {section.items?.length ? (
              <BulletList items={list(t, `${base}.${id}.items`, v)} />
            ) : null}
            {section.after?.length ? (
              <Prose paragraphs={list(t, `${base}.${id}.after`, v)} />
            ) : null}
          </Section>
        ))}
      </div>
    </Container>
  );
}
