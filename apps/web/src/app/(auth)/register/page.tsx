import { identity, markets } from "@kinora/core";
import { getBrand } from "@kinora/ui";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { RegisterForm } from "./register-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.register");
  return { title: t("title") };
}

export default async function RegisterPage() {
  const [t, locale] = await Promise.all([getTranslations("auth.register"), getLocale()]);
  const brand = getBrand(process.env).name;
  const names = new Intl.DisplayNames([locale], { type: "region" });
  const collator = new Intl.Collator(locale);
  const countries = markets.COUNTRY_CODES.map((code) => ({
    code,
    name: names.of(code) ?? code,
  })).sort((a, b) => collator.compare(a.name, b.name));

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-[800] tracking-[-0.03em]">{t("title")}</h1>
        <p className="text-ink-muted">{t("intro", { brand })}</p>
      </div>
      <RegisterForm
        brand={brand}
        countries={countries}
        passwordMin={identity.PASSWORD_MIN_LENGTH}
        passwordMax={identity.PASSWORD_MAX_LENGTH}
      />
    </div>
  );
}
