import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { BrandLink } from "@/components/auth/brand-link";
import { SkipLink } from "@/components/auth/skip-link";

// Sign-up, sign-in and recovery pages: one narrow column, content low enough to reach
// with a thumb on phones, and nothing else competing for attention.
export default async function AuthLayout({ children }: { children: ReactNode }) {
  const t = await getTranslations("auth.shell");
  return (
    <div className="flex min-h-dvh flex-col">
      <SkipLink label={t("skipToContent")} />
      <header className="mx-auto w-full max-w-md px-6 pt-6">
        <BrandLink />
      </header>
      <main
        id="main"
        className="mx-auto flex w-full max-w-md flex-1 flex-col justify-end px-6 pt-10 pb-12 sm:justify-start sm:pt-16"
      >
        {children}
      </main>
    </div>
  );
}
