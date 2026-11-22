import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { AccountNav } from "@/components/auth/account-nav";
import { BrandLink } from "@/components/auth/brand-link";
import { SkipLink } from "@/components/auth/skip-link";
import { SubmitButton } from "@/components/auth/submit-button";
import { requireSession } from "@/server/session";
import { signOut } from "./actions";

export const metadata: Metadata = { robots: { index: false } };

export default async function AccountLayout({ children }: { children: ReactNode }) {
  const session = await requireSession();
  const t = await getTranslations("auth");
  return (
    <div className="flex min-h-dvh flex-col">
      <SkipLink label={t("shell.skipToContent")} />
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-3 px-6 py-3">
          <BrandLink />
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-ink-muted sm:inline">
              {t("account.signedInAs", { name: session.user.name })}
            </span>
            <form action={signOut}>
              <SubmitButton variant="quiet" pendingLabel={t("account.signingOut")}>
                {t("account.signOut")}
              </SubmitButton>
            </form>
          </div>
        </div>
        <div className="mx-auto w-full max-w-3xl px-4 pb-2">
          <AccountNav
            label={t("account.navLabel")}
            items={[
              { href: "/account/security", label: t("account.security") },
              { href: "/account/export", label: t("account.export") },
              { href: "/account/delete", label: t("account.delete") },
            ]}
          />
        </div>
      </header>
      <main id="main" className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-10">
        {children}
      </main>
    </div>
  );
}
