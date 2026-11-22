import { cn } from "@kinora/ui";
import type { ReactNode } from "react";

/** The page's content column. Everything on the website lines up to it. */
export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-6xl px-5 sm:px-8", className)}>{children}</div>;
}

export const h1Class = "text-4xl font-[850] tracking-[-0.04em] sm:text-5xl";
export const h2Class = "text-2xl font-[800] tracking-[-0.03em] sm:text-3xl";
export const linkClass =
  "font-semibold text-primary-ink underline decoration-2 underline-offset-4 hover:decoration-primary";
