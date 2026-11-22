import { getBrand } from "@kinora/ui";
import { getTranslations } from "next-intl/server";

// Staff sign-in (with mandatory MFA) arrives in milestone 1.7. Until then this app
// exposes no data and no actions.
export default async function AdminHomePage() {
  const brand = getBrand(process.env);
  const t = await getTranslations("home");
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-4 px-6">
      <h1 className="text-3xl">{t("title", { brand: brand.name })}</h1>
      <p className="text-ink-muted">{t("unavailable")}</p>
    </main>
  );
}
