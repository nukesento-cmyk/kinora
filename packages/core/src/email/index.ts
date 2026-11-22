/**
 * Outgoing email. Core composes nothing user-facing: the app passes subject and body
 * (from its message files) and core delivers them through a Mailer.
 *
 * - Production: Resend's HTTP API, called with fetch (no SDK).
 * - Development and tests: a recording mailer that keeps messages in memory for the
 *   /api/dev/mailbox endpoint. It is chosen only when the dev mailbox is enabled,
 *   which the env schema forbids in production.
 */

import { isDevMailboxEnabled } from "@kinora/config";

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export interface Mailer {
  readonly kind: "resend" | "recording";
  send(message: EmailMessage): Promise<void>;
}

export class MailDeliveryError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "MailDeliveryError";
  }
}

export interface ResendMailerOptions {
  apiKey: string;
  from: string;
  fetch?: typeof fetch;
  endpoint?: string;
  timeoutMs?: number;
}

export function createResendMailer(options: ResendMailerOptions): Mailer {
  const doFetch = options.fetch ?? fetch;
  const endpoint = options.endpoint ?? "https://api.resend.com/emails";
  return {
    kind: "resend",
    async send(message) {
      let res: Response;
      try {
        res = await doFetch(endpoint, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${options.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: options.from,
            to: [message.to],
            subject: message.subject,
            text: message.text,
            html: message.html,
          }),
          signal: AbortSignal.timeout(options.timeoutMs ?? 10_000),
        });
      } catch (error) {
        throw new MailDeliveryError(`Email provider unreachable: ${(error as Error).name}`);
      }
      if (!res.ok) {
        // The provider's message describes the problem; it never contains our API key.
        let detail = "";
        try {
          const body = (await res.json()) as { message?: unknown };
          if (typeof body.message === "string") detail = `: ${body.message.slice(0, 200)}`;
        } catch {
          // Non-JSON error body: the status is enough.
        }
        throw new MailDeliveryError(
          `Email provider rejected the message (${res.status})${detail}`,
          res.status,
        );
      }
    },
  };
}

export interface RecordedEmail extends EmailMessage {
  id: number;
  sentAt: string;
}

/** In-memory store shared by every module instance in the process (route handlers, actions). */
export interface Mailbox {
  readonly messages: readonly RecordedEmail[];
  record(message: EmailMessage): RecordedEmail;
  clear(): void;
}

const MAILBOX_LIMIT = 200;
const MAILBOX_KEY = Symbol.for("kinora.dev-mailbox");

export function createMailbox(limit = MAILBOX_LIMIT): Mailbox {
  let messages: RecordedEmail[] = [];
  let nextId = 1;
  return {
    get messages() {
      return messages;
    },
    record(message) {
      const recorded = { ...message, id: nextId++, sentAt: new Date().toISOString() };
      messages = [...messages, recorded].slice(-limit);
      return recorded;
    },
    clear() {
      messages = [];
    },
  };
}

/** The process-wide development mailbox. */
export function devMailbox(): Mailbox {
  const g = globalThis as { [MAILBOX_KEY]?: Mailbox };
  g[MAILBOX_KEY] ??= createMailbox();
  return g[MAILBOX_KEY];
}

export function createRecordingMailer(mailbox: Mailbox): Mailer {
  return {
    kind: "recording",
    async send(message) {
      mailbox.record(message);
    },
  };
}

/** Escape text for an HTML email body. */
export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/**
 * Plain, accessible HTML for a transactional email: paragraphs and one call-to-action
 * link. Every value is escaped.
 */
export function renderEmailHtml(input: {
  paragraphs: readonly string[];
  action?: { label: string; url: string };
  footer?: string;
}): string {
  const p = input.paragraphs.map((t) => `<p>${escapeHtml(t)}</p>`).join("\n");
  const action = input.action
    ? `<p><a href="${escapeHtml(input.action.url)}">${escapeHtml(input.action.label)}</a></p>`
    : "";
  const footer = input.footer ? `<p style="color:#5c5363">${escapeHtml(input.footer)}</p>` : "";
  return `<!doctype html><html><body style="font-family:system-ui,sans-serif;line-height:1.55;color:#1e1723">\n${p}\n${action}\n${footer}\n</body></html>`;
}

/**
 * Pick the mailer for this environment. The recording mailer is only possible when
 * isDevMailboxEnabled() is true, which never holds in production.
 */
export function createMailer(env: {
  NODE_ENV?: string;
  DEV_MAILBOX?: string | undefined;
  RESEND_API_KEY?: string | undefined;
  EMAIL_FROM?: string | undefined;
}): Mailer {
  if (isDevMailboxEnabled(env)) return createRecordingMailer(devMailbox());
  if (env.RESEND_API_KEY && env.EMAIL_FROM) {
    return createResendMailer({ apiKey: env.RESEND_API_KEY, from: env.EMAIL_FROM });
  }
  throw new Error("Email delivery isn't configured: set RESEND_API_KEY and EMAIL_FROM.");
}
