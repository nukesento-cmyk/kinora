import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ConfirmEmailForm, ResendForm } from "./forms";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.verifyEmail");
  return { title: t("sentTitle"), referrer: "no-referrer" };
}

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const t = await getTranslations("auth.verifyEmail");
  const token = typeof params.token === "string" ? params.token : undefined;

  if (token) {
    return (
      <div className="flex flex-col gap-8">
        <h1 className="text-3xl font-[800] tracking-[-0.03em]">{t("confirmTitle")}</h1>
        <ConfirmEmailForm token={token} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-[800] tracking-[-0.03em]">{t("sentTitle")}</h1>
        <p className="text-ink-muted">{t("sentBody")}</p>
      </div>
      <section
        aria-labelledby="resend-title"
        className="flex flex-col gap-3 border-t border-line pt-6"
      >
        <h2 id="resend-title" className="text-lg">
          {t("resendTitle")}
        </h2>
        <p className="text-ink-muted">{t("resendBody")}</p>
        <ResendForm />
      </section>
    </div>
  );
}
