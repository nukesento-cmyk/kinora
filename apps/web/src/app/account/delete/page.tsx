import { identity } from "@kinora/core";
import { Panel } from "@kinora/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getAuthEnv } from "@/env";
import { requireSession } from "@/server/session";
import { DeleteAccountForm } from "./delete-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.deleteAccount");
  return { title: t("title") };
}

export default async function DeleteAccountPage() {
  await requireSession("/account/delete");
  const t = await getTranslations("auth.deleteAccount");
  const days = getAuthEnv().ACCOUNT_DELETION_GRACE_DAYS;
  return (
    <>
      <h1 className="text-4xl font-[850] tracking-[-0.035em]">{t("title")}</h1>
      <Panel>
        <div className="flex flex-col gap-5">
          <p className="max-w-prose">{t("intro")}</p>
          <ol className="flex max-w-prose list-decimal flex-col gap-2 pl-6 text-ink">
            <li>{t("stepNow")}</li>
            <li>{t("stepGrace", { days })}</li>
            <li>{t("stepAfter", { days })}</li>
          </ol>
          <p className="text-ink-muted">
            {t.rich("exportFirst", {
              link: (chunks) => (
                <Link
                  href="/account/export"
                  className="font-semibold text-primary-ink underline underline-offset-4"
                >
                  {chunks}
                </Link>
              ),
            })}
          </p>
          <DeleteAccountForm passwordMax={identity.PASSWORD_MAX_LENGTH} />
        </div>
      </Panel>
    </>
  );
}
