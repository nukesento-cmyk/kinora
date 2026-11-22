import { identity } from "@kinora/core";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ExpiredLink, ResetForm } from "./reset-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.resetPassword");
  return { title: t("title"), referrer: "no-referrer" };
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const t = await getTranslations("auth.resetPassword");
  const token = typeof params.token === "string" ? params.token : undefined;
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-[800] tracking-[-0.03em]">{t("title")}</h1>
        {token ? <p className="text-ink-muted">{t("intro")}</p> : null}
      </div>
      {token ? (
        <ResetForm
          token={token}
          passwordMin={identity.PASSWORD_MIN_LENGTH}
          passwordMax={identity.PASSWORD_MAX_LENGTH}
        />
      ) : (
        <ExpiredLink />
      )}
    </div>
  );
}
