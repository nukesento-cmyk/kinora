import { cn } from "../cn";

export interface SpinnerProps {
  size?: "sm" | "md";
  /** Announced to screen readers. Omit only when surrounding text already says what's loading. */
  label?: string | undefined;
  className?: string;
}

export function Spinner({ size = "md", label, className }: SpinnerProps) {
  const px = size === "sm" ? 16 : 24;
  return (
    <span role={label ? "status" : undefined} className={cn("inline-flex", className)}>
      <svg
        width={px}
        height={px}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="motion-safe:animate-spin"
      >
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
        <path
          d="M21 12a9 9 0 0 0-9-9"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      {label ? <span className="sr-only">{label}</span> : null}
    </span>
  );
}
