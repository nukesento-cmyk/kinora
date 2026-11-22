import type { ReactNode } from "react";
import { cn } from "../cn";

const tones = {
  neutral: "border-line bg-surface text-ink",
  shared: "border-transparent bg-primary-soft text-primary-ink",
} as const;

export interface TagProps {
  children: ReactNode;
  /** "shared" marks something two people have in common (an interest, a language). */
  tone?: keyof typeof tones;
  className?: string;
}

/** A short label such as an interest or a language. Not interactive. */
export function Tag({ children, tone = "neutral", className }: TagProps) {
  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center rounded-full border px-3 text-sm font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
