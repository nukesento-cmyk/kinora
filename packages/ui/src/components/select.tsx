import { ChevronDown } from "lucide-react";
import type { SelectHTMLAttributes } from "react";
import { cn } from "../cn";

/**
 * Native select styled like Input. Native keeps keyboard, screen-reader and mobile
 * pickers working everywhere. Use inside Field, which wires id and ARIA.
 */
export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <span className="relative flex w-full">
      <select
        className={cn(
          "min-h-touch w-full appearance-none rounded-control border border-line-strong bg-surface py-2 pr-10 pl-3.5 text-base text-ink",
          "transition-colors duration-150 ease-kn hover:border-ink-muted focus-visible:border-focus",
          "disabled:cursor-not-allowed disabled:bg-surface-sunken disabled:opacity-70",
          "aria-invalid:border-2 aria-invalid:border-danger",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2 text-ink-muted"
      />
    </span>
  );
}
