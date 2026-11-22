import { contentSecurityPolicy } from "@kinora/config";
import { hasSessionCookie } from "@kinora/core/session-cookie";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Runs before every page:
 * 1. A fresh CSP nonce per request. Next.js reads it from the request's
 *    Content-Security-Policy header and puts it on its own scripts.
 * 2. Signed-out visitors to /account/* go to /login. This only looks for the cookie;
 *    each account page and action checks the session on the server as well.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname.startsWith("/account") && !hasSessionCookie(request)) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(login);
  }

  const nonce = btoa(crypto.randomUUID());
  const appUrl = process.env.APP_URL ?? request.nextUrl.origin;
  const csp = contentSecurityPolicy({
    nonce,
    development: process.env.NODE_ENV === "development",
    upgradeInsecureRequests: appUrl.startsWith("https://"),
    formActionOrigins:
      process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
        ? ["https://accounts.google.com"]
        : [],
  });

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    {
      // Pages and API routes; not static files or prefetches.
      source: "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
