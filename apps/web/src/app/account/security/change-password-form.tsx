"use client";

import { Alert, Field, Input } from "@kinora/ui";
import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { SubmitButton } from "@/components/auth/submit-button";
import { changePassword, type ChangePasswordState } from "../actions";

const initial: ChangePasswordState = { status: "idle" };

export function ChangePasswordForm({
  passwordMin,
  passwordMax,
}: {
  passwordMin: number;
  passwordMax: number;
}) {
  const t = useTranslations("auth");
  const [state, action] = useActionState(changePassword, initial);
  const errors = state.status === "invalid" ? state.errors : {};
  return (
    <form action={action} noValidate className="flex max-w-md flex-col gap-5">
      {state.status === "changed" ? (
        <Alert tone="success" live="polite" title={t("security.passwordChanged")} />
      ) : null}
      {state.status === "error" ? (
        <Alert
          tone="danger"
          live="assertive"
          title={t(state.error === "rateLimited" ? "errors.rateLimited" : "errors.generic")}
        />
      ) : null}
      <Field
        id="currentPassword"
        label={t("fields.currentPassword.label")}
        error={
          errors.currentPassword ? t(`errors.currentPassword.${errors.currentPassword}`) : undefined
        }
      >
        <Input name="currentPassword" type="password" autoComplete="current-password" />
      </Field>
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
      <SubmitButton className="self-start" pendingLabel={t("security.passwordSubmitting")}>
        {t("security.passwordSubmit")}
      </SubmitButton>
    </form>
  );
}
