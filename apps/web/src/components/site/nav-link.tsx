"use client";

import { cn } from "@kinora/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** A navigation link that marks the current page for assistive tech and sighted users. */
export function NavLink({
  href,
  className,
  onNavigate,
  children,
}: {
  href: string;
  className?: string;
  onNavigate?: () => void;
  children: ReactNode;
}) {
  const current = usePathname() === href;
  return (
    <Link
      href={href}
      aria-current={current ? "page" : undefined}
      onClick={onNavigate}
      className={cn(
        "inline-flex min-h-touch items-center rounded-control px-3 font-semibold text-ink-muted",
        "hover:text-ink aria-[current=page]:text-ink",
        "aria-[current=page]:underline aria-[current=page]:decoration-primary aria-[current=page]:decoration-[3px] aria-[current=page]:underline-offset-8",
        className,
      )}
    >
      {children}
    </Link>
  );
}
