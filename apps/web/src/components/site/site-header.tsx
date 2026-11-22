import { buttonVariants, getBrand } from "@kinora/ui";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { authRoutes, primaryNav, siteRoutes } from "@/site/routes";
import { BrandMark } from "./brand-mark";
import { Container } from "./layout";
import { MobileMenu } from "./mobile-menu";
import { NavLink } from "./nav-link";

export async function SiteHeader() {
  const brand = getBrand(process.env);
  const t = await getTranslations("site");
  const items = primaryNav.map((key) => ({ href: siteRoutes[key], label: t(`nav.${key}`) }));
  const join = { href: authRoutes.register, label: t("join") };
  const signIn = { href: authRoutes.login, label: t("signIn") };

  return (
    <header className="relative border-b border-line">
      <Container className="flex min-h-18 items-center justify-between gap-4 py-2">
        <BrandMark name={brand.name} label={t("homeLink", { brand: brand.name })} />
        <nav aria-label={t("nav.label")} className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {items.map((item) => (
              <li key={item.href}>
                <NavLink href={item.href}>{item.label}</NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          <Link href={signIn.href} className={buttonVariants({ variant: "quiet" })}>
            {signIn.label}
          </Link>
          <Link href={join.href} className={buttonVariants()}>
            {join.label}
          </Link>
        </div>
        <MobileMenu
          label={t("menu")}
          navLabel={t("menuLabel")}
          items={items}
          join={join}
          signIn={signIn}
        />
      </Container>
    </header>
  );
}
