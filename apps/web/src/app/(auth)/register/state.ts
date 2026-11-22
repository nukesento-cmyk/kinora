import type { identity } from "@kinora/core";

export type RegisterField = identity.RegistrationField;

export interface RegisterValues {
  displayName: string;
  email: string;
  dobDay: string;
  dobMonth: string;
  dobYear: string;
  countryCode: string;
}

export type RegisterState =
  | { status: "idle" }
  | {
      status: "invalid";
      errors: Partial<Record<RegisterField, identity.FieldErrorCode>>;
      values: RegisterValues;
    }
  | { status: "error"; error: "generic" | "rateLimited"; values: RegisterValues }
  | { status: "under_age" }
  | { status: "waitlist"; email: string; countryCode: string };

export const initialRegisterState: RegisterState = { status: "idle" };
