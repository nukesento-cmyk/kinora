"use client";

import { cn } from "@kinora/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function AccountNav({
  label,
  items,
}: {
  label: string;
  items: { href: string; label: string }[];
}) {
  const pathname = usePathname();
  return (
    <nav aria-label={label}>
      <ul className="flex flex-wrap gap-1">
        {items.map((item) => {
          const current = pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-touch items-center rounded-control px-3.5 font-semibold",
                  current ? "bg-primary-soft text-primary-ink" : "text-ink-muted hover:text-ink",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
