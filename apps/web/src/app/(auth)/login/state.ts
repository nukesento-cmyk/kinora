export type LoginState =
  | { status: "idle" }
  | { status: "invalid"; errors: { email?: string; password?: string }; email: string }
  | { status: "failed"; email: string }
  | { status: "unverified"; email: string }
  | { status: "error"; error: "generic" | "rateLimited"; email: string };

export const initialLoginState: LoginState = { status: "idle" };
