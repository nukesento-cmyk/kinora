import { cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { cn } from "../cn";

export interface FieldProps {
  /** Id for the control. Hint and error ids are derived from it. */
  id: string;
  label: ReactNode;
  /** Shown under the label. Explains what to enter, not that something is required. */
  hint?: ReactNode;
  /** Says what's wrong and how to fix it. Setting it marks the control invalid. */
  error?: ReactNode;
  /** Adds "Optional" after the label. Fields are required unless marked optional. */
  optional?: boolean;
  optionalLabel?: string;
  className?: string;
  /** A single control (Input, Textarea, select…). It receives id and ARIA wiring. */
  children: ReactElement<Record<string, unknown>>;
}

/**
 * Label + control + hint + error, wired for screen readers:
 * the control gets id, aria-describedby (hint, error) and aria-invalid.
 * Server-component safe (no hooks).
 */
export function Field({
  id,
  label,
  hint,
  error,
  optional = false,
  optionalLabel = "Optional",
  className,
  children,
}: FieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  const control = isValidElement(children)
    ? cloneElement(children, {
        id,
        "aria-describedby": describedBy,
        "aria-invalid": error ? true : undefined,
        required: optional ? undefined : true,
      })
    : children;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-semibold text-ink">
        {label}
        {optional ? (
          <span className="ml-1.5 font-normal text-ink-muted">({optionalLabel})</span>
        ) : null}
      </label>
      {hint ? (
        <p id={hintId} className="text-sm text-ink-muted">
          {hint}
        </p>
      ) : null}
      {control}
      {error ? (
        <p id={errorId} className="text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
