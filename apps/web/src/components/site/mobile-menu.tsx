"use client";

import { buttonVariants, cn } from "@kinora/ui";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { NavLink } from "./nav-link";

export interface MobileMenuProps {
  label: string;
  navLabel: string;
  items: { href: string; label: string }[];
  join: { href: string; label: string };
  signIn: { href: string; label: string };
}

/**
 * Disclosure menu for small screens. Focus stays on the button when it opens, so the
 * links follow it in tab order. Escape closes it and returns focus to the button.
 */
export function MobileMenu({ label, navLabel, items, join, signIn }: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      button.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div className="lg:hidden">
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className={buttonVariants({ variant: "secondary", className: "gap-2 px-4" })}
      >
        {open ? (
          <X aria-hidden="true" className="size-5" />
        ) : (
          <Menu aria-hidden="true" className="size-5" />
        )}
        {label}
      </button>
      <div
        id={panelId}
        hidden={!open}
        className="absolute inset-x-0 top-full z-20 border-b border-line bg-bg"
      >
        <nav aria-label={navLabel} className="mx-auto max-w-6xl px-5 pt-2 pb-6 sm:px-8">
          <ul className="flex flex-col">
            {items.map((item) => (
              <li key={item.href} className="border-b border-line last:border-0">
                <NavLink href={item.href} onNavigate={close} className="w-full px-0 text-lg">
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Link
              href={signIn.href}
              onClick={close}
              className={cn(buttonVariants({ variant: "secondary", width: "full" }))}
            >
              {signIn.label}
            </Link>
            <Link href={join.href} onClick={close} className={buttonVariants({ width: "full" })}>
              {join.label}
            </Link>
          </div>
        </nav>
      </div>
    </div>
  );
}
