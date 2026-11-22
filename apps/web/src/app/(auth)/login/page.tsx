import { identity } from "@kinora/core";
import { getBrand } from "@kinora/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Notice } from "@/components/auth/notice";
import { SubmitButton } from "@/components/auth/submit-button";
import { getAuthEnv } from "@/env";
import { signInWithGoogle } from "./actions";
import { LoginForm } from "./login-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.login");
  return { title: t("title") };
}

const NOTICES = {
  "password-changed": "passwordChanged",
  "signed-out": "signedOut",
  "signed-out-everywhere": "signedOutEverywhere",
  "deletion-requested": "deletionRequested",
} as const;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const t = await getTranslations("auth");
  const env = getAuthEnv();
  const brand = getBrand(process.env).name;
  const next = identity.safeRedirectPath(params.next, "/account/security");
  const noticeKey =
    typeof params.notice === "string" ? NOTICES[params.notice as keyof typeof NOTICES] : undefined;

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-[800] tracking-[-0.03em]">{t("login.title")}</h1>
      {noticeKey ? (
        <Notice>{t(`login.${noticeKey}`, { days: env.ACCOUNT_DELETION_GRACE_DAYS })}</Notice>
      ) : null}
      {params.error === "google" ? <Notice tone="info">{t("login.googleFailed")}</Notice> : null}
      <LoginForm next={next} passwordMax={identity.PASSWORD_MAX_LENGTH} />
      {env.google ? (
        <div className="flex flex-col gap-3">
          <p className="flex items-center gap-3 text-sm text-ink-muted" aria-hidden="true">
            <span className="h-px flex-1 bg-line" />
            {t("login.or")}
            <span className="h-px flex-1 bg-line" />
          </p>
          <form action={signInWithGoogle} className="flex flex-col gap-2">
            <input type="hidden" name="next" value={next} />
            <SubmitButton
              variant="secondary"
              width="full"
              pendingLabel={t("login.google")}
              aria-describedby="google-hint"
            >
              {t("login.google")}
            </SubmitButton>
            <p id="google-hint" className="text-sm text-ink-muted">
              {t("login.googleHint")}
            </p>
          </form>
        </div>
      ) : null}
      <p className="text-ink-muted">
        {t.rich("login.noAccount", {
          brand,
          link: (chunks) => (
            <Link
              href="/register"
              className="font-semibold text-primary-ink underline underline-offset-4"
            >
              {chunks}
            </Link>
          ),
        })}
      </p>
    </div>
  );
}
