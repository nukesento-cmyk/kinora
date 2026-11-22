import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Teach tailwind-merge our custom text sizes so `text-sm` and `text-ink` don't collide.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl", "5xl"] }],
    },
  },
});

/** Merge class names, letting later Tailwind classes override earlier ones. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
