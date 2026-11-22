"use server";

import { identity } from "@kinora/core";
import { redirect } from "next/navigation";
import { authRequest } from "@/server/auth-request";

export type ResetState =
  | { status: "idle" }
  | { status: "invalid"; errors: { newPassword?: string; confirmPassword?: string } }
  | { status: "expired" }
  | { status: "error"; error: "generic" | "rateLimited" };

const text = (formData: FormData, name: string) => {
  const v = formData.get(name);
  return typeof v === "string" ? v : "";
};

export async function resetPassword(_prev: ResetState, formData: FormData): Promise<ResetState> {
  const token = text(formData, "token");
  if (!token || token.length > 256) return { status: "expired" };
  const checked = identity.validateFields(identity.newPasswordPairSchema, {
    newPassword: text(formData, "newPassword"),
    confirmPassword: text(formData, "confirmPassword"),
  });
  if (!checked.ok) return { status: "invalid", errors: checked.errors };
  const res = await authRequest("/reset-password", {
    body: { newPassword: checked.data.newPassword, token },
  });
  if (res.ok) redirect("/login?notice=password-changed");
  if (res.code === "RATE_LIMITED") return { status: "error", error: "rateLimited" };
  if (res.status >= 500) return { status: "error", error: "generic" };
  return { status: "expired" };
}
