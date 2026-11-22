"use server";

import { identity } from "@kinora/core";
import { redirect } from "next/navigation";
import { getServerEnv } from "@/env";
import { authRequest } from "@/server/auth-request";
import { getDb } from "@/server/auth";
import type { RegisterState, RegisterValues } from "./state";

const text = (formData: FormData, name: string) => {
  const v = formData.get(name);
  return typeof v === "string" ? v : "";
};

export async function register(_prev: RegisterState, formData: FormData): Promise<RegisterState> {
  const values: RegisterValues = {
    displayName: text(formData, "displayName"),
    email: text(formData, "email"),
    dobDay: text(formData, "dobDay"),
    dobMonth: text(formData, "dobMonth"),
    dobYear: text(formData, "dobYear"),
    countryCode: text(formData, "countryCode"),
  };
  const anyDob = [values.dobDay, values.dobMonth, values.dobYear].some((v) => v.trim());
  const dateOfBirth = anyDob
    ? (identity.dateFromParts(values.dobDay, values.dobMonth, values.dobYear) ?? "invalid")
    : "";

  const now = new Date();
  const checked = identity.validateRegistration(
    {
      displayName: values.displayName,
      email: values.email,
      password: text(formData, "password"),
      dateOfBirth,
      countryCode: values.countryCode,
    },
    now,
  );
  if (!checked.ok) return { status: "invalid", errors: checked.errors, values };

  const decision = identity.decideRegistration(checked.data, {
    markets: getServerEnv().launchMarkets,
    now,
  });
  // Under-18s: keep nothing, not even for the waitlist.
  if (decision.status === "under_age") return { status: "under_age" };
  if (decision.status === "waitlist") {
    await identity.joinWaitlist(getDb(), {
      email: checked.data.email,
      countryCode: decision.country,
    });
    return { status: "waitlist", email: checked.data.email, countryCode: decision.country };
  }

  const res = await authRequest("/sign-up/email", {
    body: {
      name: checked.data.displayName,
      email: checked.data.email,
      password: checked.data.password,
      dateOfBirth: checked.data.dateOfBirth,
      countryCode: checked.data.countryCode,
    },
  });
  if (!res.ok) {
    // The same checks run again inside Better Auth; these only differ if config changed mid-request.
    if (res.code === identity.REGISTRATION_ERRORS.underAge) return { status: "under_age" };
    if (res.code === "RATE_LIMITED") return { status: "error", error: "rateLimited", values };
    return { status: "error", error: "generic", values };
  }
  // New and already-registered addresses get the same answer (no account enumeration).
  redirect("/verify-email?sent=1");
}
