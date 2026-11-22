"use server";

import { identity } from "@kinora/core";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/server/auth";
import { authRequest, clearAuthCookies } from "@/server/auth-request";
import { requireSession } from "@/server/session";

const text = (formData: FormData, name: string) => {
  const v = formData.get(name);
  return typeof v === "string" ? v : "";
};

export async function signOut(): Promise<void> {
  await authRequest("/sign-out");
  await clearAuthCookies();
  redirect("/login?notice=signed-out");
}

export async function signOutEverywhere(): Promise<void> {
  await requireSession();
  await authRequest("/revoke-sessions");
  await clearAuthCookies();
  redirect("/login?notice=signed-out-everywhere");
}

/** Sign out one of the member's other devices. Only ever matches the member's own sessions. */
export async function revokeSession(formData: FormData): Promise<void> {
  const session = await requireSession();
  const revoked = await identity.revokeOtherSession(getDb(), {
    userId: session.user.id,
    sessionId: text(formData, "sessionId"),
    currentSessionId: session.session.id,
  });
  revalidatePath("/account/security");
  redirect(`/account/security?notice=${revoked ? "revoked" : "revoke-failed"}`);
}

export type ChangePasswordState =
  | { status: "idle" }
  | {
      status: "invalid";
      errors: { currentPassword?: string; newPassword?: string; confirmPassword?: string };
    }
  | { status: "changed" }
  | { status: "error"; error: "generic" | "rateLimited" };

export async function changePassword(
  _prev: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  await requireSession();
  const checked = identity.validateFields(identity.changePasswordSchema, {
    currentPassword: text(formData, "currentPassword"),
    newPassword: text(formData, "newPassword"),
    confirmPassword: text(formData, "confirmPassword"),
  });
  if (!checked.ok) return { status: "invalid", errors: checked.errors };
  const res = await authRequest("/change-password", {
    body: {
      currentPassword: checked.data.currentPassword,
      newPassword: checked.data.newPassword,
      revokeOtherSessions: true,
    },
  });
  // No revalidation here: this request still carries the old (now revoked) session
  // cookie, so re-rendering the page in it would look signed out. The new cookie is set.
  if (res.ok) return { status: "changed" };
  if (res.code === "RATE_LIMITED") return { status: "error", error: "rateLimited" };
  if (res.code === "INVALID_PASSWORD") {
    return { status: "invalid", errors: { currentPassword: "wrong" } };
  }
  return { status: "error", error: "generic" };
}

export type DeleteAccountState =
  | { status: "idle" }
  | { status: "invalid"; error: string }
  | { status: "error"; error: "generic" | "rateLimited" };

export async function requestDeletion(
  _prev: DeleteAccountState,
  formData: FormData,
): Promise<DeleteAccountState> {
  const session = await requireSession("/account/delete");
  const checked = identity.validateFields(identity.confirmPasswordSchema, {
    password: text(formData, "password"),
  });
  if (!checked.ok) return { status: "invalid", error: checked.errors.password ?? "required" };
  const verified = await authRequest("/verify-password", {
    body: { password: checked.data.password },
  });
  if (verified.code === "RATE_LIMITED") return { status: "error", error: "rateLimited" };
  if (!verified.ok) {
    return verified.status >= 500
      ? { status: "error", error: "generic" }
      : { status: "invalid", error: "wrong" };
  }
  const result = await identity.requestAccountDeletion(getDb(), session.user.id, new Date());
  if (result.status !== "requested") return { status: "error", error: "generic" };
  await clearAuthCookies();
  redirect("/login?notice=deletion-requested");
}
