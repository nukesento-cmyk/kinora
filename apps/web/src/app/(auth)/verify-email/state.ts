export type ConfirmState =
  | { status: "idle" }
  | { status: "confirmed" }
  | { status: "invalid" }
  | { status: "error"; error: "generic" | "rateLimited" };
export const initialConfirmState: ConfirmState = { status: "idle" };

export type ResendState =
  | { status: "idle" }
  | { status: "invalid"; error: string; email: string }
  | { status: "sent" }
  | { status: "error"; error: "generic" | "rateLimited"; email: string };
export const initialResendState: ResendState = { status: "idle" };
