import { getSessionCookie } from "better-auth/cookies";

/** Session cookies use this prefix: kn.session_token, or __Secure-kn.session_token over HTTPS. */
export const AUTH_COOKIE_PREFIX = "kn";

/**
 * Cheap check for a session cookie, for redirects in the proxy. It doesn't prove the
 * session is valid: pages and actions always check the session on the server.
 */
export function hasSessionCookie(request: Request | Headers): boolean {
  return getSessionCookie(request, { cookiePrefix: AUTH_COOKIE_PREFIX }) !== null;
}
