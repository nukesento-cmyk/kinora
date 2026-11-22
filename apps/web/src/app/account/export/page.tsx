import { buttonVariants, getBrand, Panel } from "@kinora/ui";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireSession } from "@/server/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.exportData");
  return { title: t("title") };
}

export default async function ExportPage() {
  await requireSession("/account/export");
  const t = await getTranslations("auth.exportData");
  return (
    <>
      <h1 className="text-4xl font-[850] tracking-[-0.035em]">{t("title")}</h1>
      <Panel>
        <div className="flex flex-col gap-5">
          <p className="max-w-prose">{t("intro", { brand: getBrand(process.env).name })}</p>
          <p className="max-w-prose text-ink-muted">{t("includes")}</p>
          {/* A plain link: the download is a GET that the server answers with an attachment. */}
          <a href="/account/export/download" download className={`${buttonVariants()} self-start`}>
            {t("download")}
          </a>
          <p className="text-sm text-ink-muted">{t("safety")}</p>
        </div>
      </Panel>
    </>
  );
}
