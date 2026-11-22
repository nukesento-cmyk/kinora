import { isDevMailboxEnabled } from "@kinora/config";
import type { email } from "@kinora/core";

/**
 * GET /api/dev/mailbox[?to=address]: messages the recording mailer has "sent".
 * 404 unless NODE_ENV isn't production and DEV_MAILBOX is exactly "true".
 * DELETE empties it. Lets e2e tests read verification and reset links.
 */
export function devMailboxResponse(
  request: Request,
  env: Record<string, string | undefined>,
  mailbox: email.Mailbox,
): Response {
  if (!isDevMailboxEnabled(env)) return new Response("Not Found", { status: 404 });
  const headers = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" };
  if (request.method === "DELETE") {
    mailbox.clear();
    return new Response(null, { status: 204, headers });
  }
  const to = new URL(request.url).searchParams.get("to")?.trim().toLowerCase();
  const messages = to
    ? mailbox.messages.filter((m) => m.to.toLowerCase() === to)
    : mailbox.messages;
  return Response.json({ messages }, { headers });
}
