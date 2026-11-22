"use client";

import { Alert, Field, Input } from "@kinora/ui";
import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { SubmitButton } from "@/components/auth/submit-button";
import { requestDeletion, type DeleteAccountState } from "../actions";

const initial: DeleteAccountState = { status: "idle" };

export function DeleteAccountForm({ passwordMax }: { passwordMax: number }) {
  const t = useTranslations("auth");
  const [state, action] = useActionState(requestDeletion, initial);
  const error =
    state.status === "invalid"
      ? state.error === "wrong"
        ? t("deleteAccount.wrongPassword")
        : t(`errors.password.${state.error}`, { min: 0, max: passwordMax })
      : undefined;
  return (
    <form action={action} noValidate className="flex max-w-md flex-col gap-5">
      {state.status === "error" ? (
        <Alert
          tone="danger"
          live="assertive"
          title={t(state.error === "rateLimited" ? "errors.rateLimited" : "errors.generic")}
        />
      ) : null}
      <Field id="delete-password" label={t("deleteAccount.passwordLabel")} error={error}>
        <Input name="password" type="password" autoComplete="current-password" />
      </Field>
      <SubmitButton
        variant="danger"
        className="self-start"
        pendingLabel={t("deleteAccount.submitting")}
      >
        {t("deleteAccount.submit")}
      </SubmitButton>
    </form>
  );
}
