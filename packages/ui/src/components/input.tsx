import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "../cn";

const control = [
  "w-full rounded-control border border-line-strong bg-surface px-3.5 text-base text-ink",
  "placeholder:text-ink-muted",
  "transition-colors duration-150 ease-kn",
  "hover:border-ink-muted",
  "focus-visible:border-focus",
  "disabled:cursor-not-allowed disabled:bg-surface-sunken disabled:opacity-70",
  "aria-invalid:border-danger aria-invalid:border-2",
].join(" ");

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(control, "min-h-touch", className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(control, "min-h-28 py-2.5", className)} {...props} />;
}
