import { getBrand } from "@kinora/ui";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

/** The brand name as a link home, with the kin ring as its mark. */
export async function BrandLink() {
  const brand = getBrand(process.env);
  const t = await getTranslations("auth.shell");
  return (
    <Link
      href="/"
      aria-label={t("home", { brand: brand.name })}
      className="inline-flex min-h-touch items-center gap-2.5 rounded-control text-lg font-[850] tracking-[-0.03em]"
    >
      <span aria-hidden="true" className="size-5 rounded-full border-4 border-primary" />
      <span aria-hidden="true">{brand.name}</span>
    </Link>
  );
}
