"use client";

import { Alert, buttonVariants, Field, Input } from "@kinora/ui";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { SubmitButton } from "@/components/auth/submit-button";
import { requestReset, type ForgotState } from "./actions";

const initial: ForgotState = { status: "idle" };

export function ForgotForm() {
  const t = useTranslations("auth");
  const [state, action] = useActionState(requestReset, initial);
  if (state.status === "sent") {
    return (
      <div className="flex flex-col gap-6">
        <Alert tone="success" live="polite" title={t("forgotPassword.sentTitle")}>
          {t("forgotPassword.sentBody", { email: state.email })}
        </Alert>
        <Link href="/login" className={buttonVariants({ variant: "secondary", width: "full" })}>
          {t("forgotPassword.backToSignIn")}
        </Link>
      </div>
    );
  }
  return (
    <form action={action} noValidate className="flex flex-col gap-5">
      {state.status === "error" ? (
        <Alert
          tone="danger"
          live="assertive"
          title={t(state.error === "rateLimited" ? "errors.rateLimited" : "errors.generic")}
        />
      ) : null}
      <Field
        id="email"
        label={t("fields.email.label")}
        error={state.status === "invalid" ? t(`errors.email.${state.error}`) : undefined}
      >
        <Input
          name="email"
          type="email"
          autoComplete="email"
          spellCheck={false}
          defaultValue={state.status === "idle" ? undefined : state.email}
        />
      </Field>
      <SubmitButton width="full" pendingLabel={t("forgotPassword.submitting")}>
        {t("forgotPassword.submit")}
      </SubmitButton>
      <Link
        href="/login"
        className="inline-flex min-h-touch items-center self-start font-semibold text-primary-ink underline underline-offset-4"
      >
        {t("forgotPassword.backToSignIn")}
      </Link>
    </form>
  );
}
