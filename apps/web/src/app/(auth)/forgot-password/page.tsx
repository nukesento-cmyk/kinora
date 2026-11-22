import { getBrand } from "@kinora/ui";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ForgotForm } from "./forgot-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.forgotPassword");
  return { title: t("title") };
}

export default async function ForgotPasswordPage() {
  const t = await getTranslations("auth.forgotPassword");
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-[800] tracking-[-0.03em]">{t("title")}</h1>
        <p className="text-ink-muted">{t("intro", { brand: getBrand(process.env).name })}</p>
      </div>
      <ForgotForm />
    </div>
  );
}
