"use client";

import { Alert, buttonVariants, Field, Input } from "@kinora/ui";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { SubmitButton } from "@/components/auth/submit-button";
import { resetPassword, type ResetState } from "./actions";

const initial: ResetState = { status: "idle" };

export function ResetForm({
  token,
  passwordMin,
  passwordMax,
}: {
  token: string;
  passwordMin: number;
  passwordMax: number;
}) {
  const t = useTranslations("auth");
  const [state, action] = useActionState(resetPassword, initial);
  if (state.status === "expired") return <ExpiredLink />;
  const errors = state.status === "invalid" ? state.errors : {};
  return (
    <form action={action} noValidate className="flex flex-col gap-5">
      {state.status === "error" ? (
        <Alert
          tone="danger"
          live="assertive"
          title={t(state.error === "rateLimited" ? "errors.rateLimited" : "errors.generic")}
        />
      ) : null}
      {state.status === "invalid" ? (
        <Alert tone="danger" live="assertive" title={t("errors.summary")} />
      ) : null}
      <input type="hidden" name="token" value={token} />
      <Field
        id="newPassword"
        label={t("fields.newPassword.label")}
        hint={t("fields.newPassword.hint", { min: passwordMin })}
        error={
          errors.newPassword
            ? t(`errors.password.${errors.newPassword}`, { min: passwordMin, max: passwordMax })
            : undefined
        }
      >
        <Input name="newPassword" type="password" autoComplete="new-password" />
      </Field>
      <Field
        id="confirmPassword"
        label={t("fields.confirmPassword.label")}
        error={
          errors.confirmPassword ? t(`errors.confirmPassword.${errors.confirmPassword}`) : undefined
        }
      >
        <Input name="confirmPassword" type="password" autoComplete="new-password" />
      </Field>
      <SubmitButton width="full" pendingLabel={t("resetPassword.submitting")}>
        {t("resetPassword.submit")}
      </SubmitButton>
    </form>
  );
}

export function ExpiredLink() {
  const t = useTranslations("auth.resetPassword");
  return (
    <div className="flex flex-col gap-6">
      <Alert tone="warning" live="assertive" title={t("invalidTitle")}>
        {t("invalidBody")}
      </Alert>
      <Link href="/forgot-password" className={buttonVariants({ width: "full" })}>
        {t("requestNew")}
      </Link>
    </div>
  );
}
