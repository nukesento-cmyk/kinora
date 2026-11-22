"use client";

import { Button, type ButtonProps } from "@kinora/ui";
import { useFormStatus } from "react-dom";

/** Submit button that shows a spinner and blocks repeat presses while its form is sending. */
export function SubmitButton({
  pendingLabel,
  ...props
}: Omit<ButtonProps, "type" | "loading" | "loadingLabel"> & { pendingLabel: string }) {
  const { pending } = useFormStatus();
  return <Button type="submit" loading={pending} loadingLabel={pendingLabel} {...props} />;
}
