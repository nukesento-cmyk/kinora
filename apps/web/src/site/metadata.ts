import { getBrand } from "@kinora/ui";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

/**
 * Metadata for a public page: title, description and canonical URL from its messages.
 * `namespace` points at a messages object with meta.title and meta.description.
 */
export async function pageMetadata(namespace: string, path: string): Promise<Metadata> {
  const brand = getBrand(process.env);
  const t = await getTranslations(namespace);
  const title = t("meta.title", { brand: brand.name });
  const description = t("meta.description", { brand: brand.name });
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title: `${title} | ${brand.name}`, description, url: path, siteName: brand.name },
  };
}
