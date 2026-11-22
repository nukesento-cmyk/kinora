import { Alert } from "@kinora/ui";
import type { ReactNode } from "react";

/** A status message shown after a redirect (e.g. "You've been signed out."). Announced politely. */
export function Notice({
  tone = "success",
  children,
}: {
  tone?: "success" | "info";
  children: ReactNode;
}) {
  return <Alert tone={tone} live="polite" title={children} />;
}
