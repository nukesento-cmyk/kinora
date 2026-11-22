"use client";

import { Alert, buttonVariants, Field, Input } from "@kinora/ui";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { SubmitButton } from "@/components/auth/submit-button";
import { confirmEmail, resendVerification } from "./actions";
import { initialConfirmState, initialResendState } from "./state";

export function ConfirmEmailForm({ token }: { token: string }) {
  const t = useTranslations("auth");
  const [state, action] = useActionState(confirmEmail, initialConfirmState);

  if (state.status === "confirmed") {
    return (
      <div className="flex flex-col gap-6">
        <Alert tone="success" live="polite" title={t("verifyEmail.confirmedTitle")}>
          {t("verifyEmail.confirmedBody")}
        </Alert>
        <Link href="/login" className={buttonVariants({ width: "full" })}>
          {t("verifyEmail.signIn")}
        </Link>
      </div>
    );
  }
  if (state.status === "invalid") {
    return (
      <div className="flex flex-col gap-6">
        <Alert tone="warning" live="assertive" title={t("verifyEmail.invalidTitle")}>
          {t("verifyEmail.invalidBody")}
        </Alert>
        <Link href="/login" className={buttonVariants({ variant: "secondary", width: "full" })}>
          {t("verifyEmail.signIn")}
        </Link>
      </div>
    );
  }
  return (
    <form action={action} className="flex flex-col gap-5">
      {state.status === "error" ? (
        <Alert
          tone="danger"
          live="assertive"
          title={t(state.error === "rateLimited" ? "errors.rateLimited" : "errors.generic")}
        />
      ) : null}
      <p className="text-ink-muted">{t("verifyEmail.confirmBody")}</p>
      <input type="hidden" name="token" value={token} />
      <SubmitButton width="full" pendingLabel={t("verifyEmail.confirming")}>
        {t("verifyEmail.confirmSubmit")}
      </SubmitButton>
    </form>
  );
}

export function ResendForm() {
  const t = useTranslations("auth");
  const [state, action] = useActionState(resendVerification, initialResendState);
  if (state.status === "sent") {
    return <Alert tone="success" live="polite" title={t("verifyEmail.resent")} />;
  }
  return (
    <form action={action} noValidate className="flex flex-col gap-4">
      {state.status === "error" ? (
        <Alert
          tone="danger"
          live="assertive"
          title={t(state.error === "rateLimited" ? "errors.rateLimited" : "errors.generic")}
        />
      ) : null}
      <Field
        id="resend-email"
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
      <SubmitButton variant="secondary" pendingLabel={t("verifyEmail.resending")}>
        {t("verifyEmail.resendSubmit")}
      </SubmitButton>
    </form>
  );
}
