"use client";

import { Alert, Field, Input } from "@kinora/ui";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { SubmitButton } from "@/components/auth/submit-button";
import { signIn } from "./actions";
import { initialLoginState } from "./state";

export function LoginForm({ next, passwordMax }: { next: string; passwordMax: number }) {
  const t = useTranslations("auth");
  const [state, action] = useActionState(signIn, initialLoginState);
  const errors = state.status === "invalid" ? state.errors : {};
  const email = state.status === "idle" ? undefined : state.email;

  return (
    <form action={action} noValidate className="flex flex-col gap-5">
      <input type="hidden" name="next" value={next} />
      {state.status === "failed" ? (
        <Alert tone="danger" live="assertive" title={t("login.failed")} />
      ) : null}
      {state.status === "unverified" ? (
        <Alert
          tone="warning"
          live="assertive"
          title={t("login.unverified", { email: state.email })}
        />
      ) : null}
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
      <Field
        id="email"
        label={t("fields.email.label")}
        error={errors.email ? t(`errors.email.${errors.email}`) : undefined}
      >
        <Input
          name="email"
          type="email"
          autoComplete="username"
          spellCheck={false}
          defaultValue={email}
        />
      </Field>
      <Field
        id="password"
        label={t("fields.password.label")}
        error={
          errors.password
            ? t(`errors.password.${errors.password}`, { min: 0, max: passwordMax })
            : undefined
        }
      >
        <Input name="password" type="password" autoComplete="current-password" />
      </Field>
      <SubmitButton width="full" pendingLabel={t("login.submitting")}>
        {t("login.submit")}
      </SubmitButton>
      <Link
        href="/forgot-password"
        className="inline-flex min-h-touch items-center self-start font-semibold text-primary-ink underline underline-offset-4"
      >
        {t("login.forgot")}
      </Link>
    </form>
  );
}
