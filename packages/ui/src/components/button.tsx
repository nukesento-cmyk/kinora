import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "../cn";
import { Spinner } from "./spinner";

/**
 * Button styles. Use `buttonVariants()` on a link (e.g. Next.js <Link>) when the
 * action navigates; use <Button> when it does something on the page.
 */
export const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold",
    "rounded-control transition-colors duration-150 ease-kn",
    "disabled:cursor-not-allowed disabled:opacity-55",
    "aria-busy:cursor-progress",
  ],
  {
    variants: {
      variant: {
        primary: "bg-primary text-on-primary hover:bg-primary-hover",
        secondary:
          "border border-line-strong bg-surface text-ink hover:border-primary hover:text-primary-ink",
        quiet: "text-primary-ink hover:bg-primary-soft",
        danger: "bg-danger text-on-danger hover:opacity-90",
      },
      size: {
        // 44px: the default everywhere a person taps.
        md: "min-h-touch px-5 text-base",
        // 36px: only for dense staff tools, never for primary member actions.
        sm: "min-h-9 px-3.5 text-sm",
      },
      width: {
        auto: "",
        full: "w-full",
      },
    },
    defaultVariants: { variant: "primary", size: "md", width: "auto" },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  /** Shows a spinner, sets aria-busy and blocks repeat submits. */
  loading?: boolean;
  /** Accessible label for the spinner while loading, e.g. "Saving". */
  loadingLabel?: string;
}

export function Button({
  className,
  variant,
  size,
  width,
  loading = false,
  loadingLabel,
  disabled,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size, width }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Spinner size="sm" label={loadingLabel} /> : null}
      {children}
    </button>
  );
}
