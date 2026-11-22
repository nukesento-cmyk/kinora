import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../cn";

const tones = {
  info: { box: "bg-info-soft text-info-ink", Icon: Info },
  success: { box: "bg-success-soft text-success", Icon: CircleCheck },
  warning: { box: "bg-warning-soft text-warning-ink", Icon: TriangleAlert },
  danger: { box: "bg-danger-soft text-danger", Icon: CircleAlert },
} as const;

export interface AlertProps {
  tone?: keyof typeof tones;
  title: ReactNode;
  children?: ReactNode;
  /**
   * "polite" announces the message when it appears (status updates),
   * "assertive" interrupts (errors that block the person). Omit for static content.
   */
  live?: "polite" | "assertive";
  className?: string;
}

/** Colour is never the only signal: each tone has its own icon and a title. */
export function Alert({ tone = "info", title, children, live, className }: AlertProps) {
  const { box, Icon } = tones[tone];
  return (
    <div
      role={live === "assertive" ? "alert" : live === "polite" ? "status" : undefined}
      className={cn("flex gap-3 rounded-panel p-4", box, className)}
    >
      <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
      <div className="flex flex-col gap-1">
        <p className="font-semibold">{title}</p>
        {children ? <div className="text-sm text-ink">{children}</div> : null}
      </div>
    </div>
  );
}
