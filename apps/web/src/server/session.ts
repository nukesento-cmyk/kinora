import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getAuth } from "./auth";

/** The signed-in member for this request, checked against the database. Null when signed out. */
export const getSession = cache(async () => {
  // Cookies, not the raw Cookie header: after a server action has replaced the session
  // cookie (e.g. changing the password), the re-render must see the new one.
  const requestHeaders = new Headers(await headers());
  requestHeaders.set("cookie", (await cookies()).toString());
  return getAuth().api.getSession({ headers: requestHeaders });
});

/** The real gate for /account pages and actions: the proxy's redirect is only a convenience. */
export async function requireSession(next = "/account/security") {
  const session = await getSession();
  if (!session) redirect(`/login?next=${encodeURIComponent(next)}`);
  return session;
}
