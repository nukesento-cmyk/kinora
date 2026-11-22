"use server";

import { identity } from "@kinora/core";
import { authRequest } from "@/server/auth-request";

export type ForgotState =
  | { status: "idle" }
  | { status: "invalid"; error: string; email: string }
  | { status: "sent"; email: string }
  | { status: "error"; error: "generic" | "rateLimited"; email: string };

export async function requestReset(_prev: ForgotState, formData: FormData): Promise<ForgotState> {
  const raw = formData.get("email");
  const email = typeof raw === "string" ? raw : "";
  const checked = identity.validateFields(identity.emailOnlySchema, { email });
  if (!checked.ok) return { status: "invalid", error: checked.errors.email ?? "invalid", email };
  const res = await authRequest("/request-password-reset", {
    body: { email: checked.data.email, redirectTo: "/reset-password" },
  });
  if (res.code === "RATE_LIMITED") return { status: "error", error: "rateLimited", email };
  if (res.status >= 500) return { status: "error", error: "generic", email };
  // Always the same message, whether or not the account exists.
  return { status: "sent", email: checked.data.email };
}
