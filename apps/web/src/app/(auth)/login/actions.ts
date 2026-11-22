"use server";

import { identity } from "@kinora/core";
import { redirect } from "next/navigation";
import { authRequest } from "@/server/auth-request";
import type { LoginState } from "./state";

const text = (formData: FormData, name: string) => {
  const v = formData.get(name);
  return typeof v === "string" ? v : "";
};

export async function signIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = text(formData, "email");
  const next = identity.safeRedirectPath(text(formData, "next"), "/account/security");
  const checked = identity.validateFields(identity.signInSchema, {
    email,
    password: text(formData, "password"),
  });
  if (!checked.ok) return { status: "invalid", errors: checked.errors, email };

  const res = await authRequest("/sign-in/email", {
    body: { email: checked.data.email, password: checked.data.password, rememberMe: true },
  });
  if (res.ok) redirect(next);
  if (res.code === "RATE_LIMITED") return { status: "error", error: "rateLimited", email };
  // Only reachable with the right password, so it reveals nothing to someone guessing.
  if (res.code === "EMAIL_NOT_VERIFIED") return { status: "unverified", email: checked.data.email };
  if (res.status >= 500) return { status: "error", error: "generic", email };
  // Wrong password, unknown email, no password set: one message for all of them.
  return { status: "failed", email };
}

export async function signInWithGoogle(formData: FormData): Promise<void> {
  const next = identity.safeRedirectPath(text(formData, "next"), "/account/security");
  const res = await authRequest<{ url?: string }>("/sign-in/social", {
    body: { provider: "google", callbackURL: next, errorCallbackURL: "/login?error=google" },
  });
  if (res.ok && res.data?.url?.startsWith("https://accounts.google.com/")) redirect(res.data.url);
  redirect("/login?error=google");
}
