"use server";

import { identity } from "@kinora/core";
import { authRequest } from "@/server/auth-request";
import type { ConfirmState, ResendState } from "./state";

const text = (formData: FormData, name: string) => {
  const v = formData.get(name);
  return typeof v === "string" ? v : "";
};

/**
 * Confirming takes a button press rather than happening when the link opens, so mail
 * scanners that open links can't confirm an address on someone's behalf.
 */
export async function confirmEmail(_prev: ConfirmState, formData: FormData): Promise<ConfirmState> {
  const token = text(formData, "token");
  if (!token || token.length > 4096) return { status: "invalid" };
  const res = await authRequest(`/verify-email?token=${encodeURIComponent(token)}`, {
    method: "GET",
  });
  if (res.ok) return { status: "confirmed" };
  if (res.code === "RATE_LIMITED") return { status: "error", error: "rateLimited" };
  if (res.status >= 500) return { status: "error", error: "generic" };
  return { status: "invalid" };
}

export async function resendVerification(
  _prev: ResendState,
  formData: FormData,
): Promise<ResendState> {
  const email = text(formData, "email");
  const checked = identity.validateFields(identity.emailOnlySchema, { email });
  if (!checked.ok) return { status: "invalid", error: checked.errors.email ?? "invalid", email };
  const res = await authRequest("/send-verification-email", {
    body: { email: checked.data.email, callbackURL: "/login" },
  });
  if (res.code === "RATE_LIMITED") return { status: "error", error: "rateLimited", email };
  if (res.status >= 500) return { status: "error", error: "generic", email };
  // Same answer whether or not the address has an account.
  return { status: "sent" };
}
