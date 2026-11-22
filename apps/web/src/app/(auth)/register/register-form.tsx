"use client";

import { Alert, buttonVariants, Field, Input, Select } from "@kinora/ui";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { DateOfBirthField } from "@/components/auth/date-of-birth-field";
import { SubmitButton } from "@/components/auth/submit-button";
import { register } from "./actions";
import { initialRegisterState, type RegisterField } from "./state";

interface Props {
  brand: string;
  countries: { code: string; name: string }[];
  passwordMin: number;
  passwordMax: number;
}

export function RegisterForm({ brand, countries, passwordMin, passwordMax }: Props) {
  const t = useTranslations("auth");
  const [state, action] = useActionState(register, initialRegisterState);
  const countryName = (code: string) => countries.find((c) => c.code === code)?.name ?? code;

  if (state.status === "under_age") {
    return (
      <div className="flex flex-col gap-6">
        <Alert tone="info" live="assertive" title={t("register.underAgeTitle", { brand })}>
          {t("register.underAgeBody")}
        </Alert>
        <Link href="/" className={buttonVariants({ variant: "secondary" })}>
          {t("register.waitlistAction")}
        </Link>
      </div>
    );
  }

  if (state.status === "waitlist") {
    const country = countryName(state.countryCode);
    return (
      <div className="flex flex-col gap-6">
        <Alert tone="success" live="polite" title={t("register.waitlistTitle", { country })}>
          {t("register.waitlistBody", { email: state.email, country })}
        </Alert>
        <Link href="/" className={buttonVariants({ variant: "secondary" })}>
          {t("register.waitlistAction")}
        </Link>
      </div>
    );
  }

  const values = state.status === "invalid" || state.status === "error" ? state.values : undefined;
  const errors = state.status === "invalid" ? state.errors : {};
  const error = (field: RegisterField) => {
    const code = errors[field];
    return code ? t(`errors.${field}.${code}`, { min: passwordMin, max: passwordMax }) : undefined;
  };

  return (
    <form action={action} noValidate className="flex flex-col gap-5">
      {state.status === "invalid" ? (
        <Alert tone="danger" live="assertive" title={t("errors.summary")} />
      ) : null}
      {state.status === "error" ? (
        <Alert
          tone="danger"
          live="assertive"
          title={t(state.error === "rateLimited" ? "errors.rateLimited" : "errors.generic")}
        />
      ) : null}
      <Field
        id="displayName"
        label={t("fields.displayName.label")}
        hint={t("fields.displayName.hint")}
        error={error("displayName")}
      >
        <Input
          name="displayName"
          autoComplete="nickname"
          maxLength={50}
          defaultValue={values?.displayName}
        />
      </Field>
      <Field id="email" label={t("fields.email.label")} error={error("email")}>
        <Input
          name="email"
          type="email"
          autoComplete="email"
          spellCheck={false}
          defaultValue={values?.email}
        />
      </Field>
      <Field
        id="password"
        label={t("fields.password.label")}
        hint={t("fields.newPassword.hint", { min: passwordMin })}
        error={error("password")}
      >
        <Input name="password" type="password" autoComplete="new-password" />
      </Field>
      <DateOfBirthField
        idPrefix="dob"
        legend={t("fields.dateOfBirth.legend")}
        hint={t("fields.dateOfBirth.hint")}
        labels={{
          day: t("fields.dateOfBirth.day"),
          month: t("fields.dateOfBirth.month"),
          year: t("fields.dateOfBirth.year"),
        }}
        defaults={{
          day: values?.dobDay ?? "",
          month: values?.dobMonth ?? "",
          year: values?.dobYear ?? "",
        }}
        error={error("dateOfBirth")}
      />
      <Field
        id="countryCode"
        label={t("fields.country.label")}
        hint={t("fields.country.hint")}
        error={error("countryCode")}
      >
        <Select name="countryCode" autoComplete="country" defaultValue={values?.countryCode ?? ""}>
          <option value="" disabled>
            {t("fields.country.placeholder")}
          </option>
          {countries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </Select>
      </Field>
      <SubmitButton width="full" pendingLabel={t("register.submitting")}>
        {t("register.submit")}
      </SubmitButton>
      <p className="text-ink-muted">
        {t.rich("register.haveAccount", {
          link: (chunks) => (
            <Link
              href="/login"
              className="font-semibold text-primary-ink underline underline-offset-4"
            >
              {chunks}
            </Link>
          ),
        })}
      </p>
    </form>
  );
}
