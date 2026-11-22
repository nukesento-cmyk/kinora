import "server-only";
import { parseSetCookieHeader, toCookieOptions } from "better-auth/cookies";
import { AUTH_COOKIE_PREFIX } from "@kinora/core/session-cookie";
import { cookies, headers } from "next/headers";
import { getAuthEnv } from "@/env";
import { getAuth } from "./auth";

/** Headers passed from the browser's request to Better Auth (CSRF, rate limiting, session). */
const FORWARDED = [
  "cookie",
  "origin",
  "referer",
  "user-agent",
  "x-forwarded-for",
  "sec-fetch-site",
  "sec-fetch-mode",
  "sec-fetch-dest",
] as const;

export interface AuthResult<T = unknown> {
  ok: boolean;
  status: number;
  /** Better Auth error code, e.g. INVALID_EMAIL_OR_PASSWORD. */
  code: string | undefined;
  data: T | null;
}

/**
 * Call a Better Auth endpoint from a server action through its HTTP router, not
 * `auth.api`. Only the router applies rate limiting and the origin (CSRF) check,
 * so every form gets the same protection as a direct API call. Cookies Better Auth
 * sets or clears are copied onto the action's response.
 */
export async function authRequest<T = unknown>(
  path: `/${string}`,
  init: { method?: "GET" | "POST"; body?: unknown } = {},
): Promise<AuthResult<T>> {
  const env = getAuthEnv();
  const incoming = await headers();
  const forwarded = new Headers({ accept: "application/json" });
  for (const name of FORWARDED) {
    const value = incoming.get(name);
    if (value) forwarded.set(name, value);
  }
  const method = init.method ?? "POST";
  if (method === "POST") forwarded.set("content-type", "application/json");

  const response = await getAuth().handler(
    new Request(new URL(`/api/auth${path}`, env.APP_URL), {
      method,
      headers: forwarded,
      body: method === "POST" ? JSON.stringify(init.body ?? {}) : undefined,
    }),
  );

  const jar = await cookies();
  for (const header of response.headers.getSetCookie()) {
    for (const [name, attributes] of parseSetCookieHeader(header)) {
      const o = toCookieOptions(attributes);
      jar.set(name, attributes.value, {
        httpOnly: o.httpOnly,
        sameSite: o.sameSite,
        secure: o.secure,
        path: o.path ?? "/",
        maxAge: o.maxAge,
        expires: o.expires,
        domain: o.domain,
      });
    }
  }

  let data: unknown = null;
  if (response.headers.get("content-type")?.includes("application/json")) {
    data = await response.json().catch(() => null);
  }
  const code =
    response.status === 429
      ? "RATE_LIMITED"
      : (data as { code?: unknown } | null)?.code &&
          typeof (data as { code: unknown }).code === "string"
        ? (data as { code: string }).code
        : undefined;
  return { ok: response.ok, status: response.status, code, data: response.ok ? (data as T) : null };
}

/** Remove this browser's auth cookies (after its sessions were revoked on the server). */
export async function clearAuthCookies(): Promise<void> {
  const prefix = `${AUTH_COOKIE_PREFIX}.`;
  const jar = await cookies();
  for (const { name } of jar.getAll()) {
    if (name.startsWith(prefix) || name.startsWith(`__Secure-${prefix}`)) jar.delete(name);
  }
}
