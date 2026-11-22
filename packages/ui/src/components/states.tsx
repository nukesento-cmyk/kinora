import type { ReactNode } from "react";
import { cn } from "../cn";

/** Placeholder shape while content loads. Hidden from assistive tech; pair with a status message. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("rounded-control bg-surface-sunken motion-safe:animate-pulse", className)}
    />
  );
}

export interface EmptyStateProps {
  title: ReactNode;
  /** What this space is for and what the person can do next. */
  description: ReactNode;
  /** The one action that fills this space (a Button or a link styled with buttonVariants). */
  action?: ReactNode;
  className?: string;
}

/** An empty screen is an invitation to act, never just "Nothing here". */
export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-start gap-3 rounded-panel border border-dashed border-line-strong p-6",
        className,
      )}
    >
      <h3 className="text-lg">{title}</h3>
      <p className="max-w-prose text-ink-muted">{description}</p>
      {action ? <div className="pt-1">{action}</div> : null}
    </div>
  );
}

export function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <section className={cn("rounded-panel border border-line bg-surface p-5 sm:p-6", className)}>
      {children}
    </section>
  );
}
