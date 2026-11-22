import { describe, expect, it, vi } from "vitest";
import {
  createMailbox,
  createMailer,
  createRecordingMailer,
  createResendMailer,
  MailDeliveryError,
  renderEmailHtml,
} from "./index";

const message = { to: "amani@example.com", subject: "Hello", text: "Hi", html: "<p>Hi</p>" };

describe("createResendMailer", () => {
  it("posts the message to Resend with the API key as a bearer token", async () => {
    const fetchMock = vi.fn(async () => Response.json({ id: "email_1" }));
    const mailer = createResendMailer({
      apiKey: "re_test",
      from: "KINORA <hello@example.com>",
      fetch: fetchMock as unknown as typeof fetch,
    });
    await mailer.send(message);
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer re_test");
    expect(JSON.parse(init.body as string)).toEqual({
      from: "KINORA <hello@example.com>",
      to: ["amani@example.com"],
      subject: "Hello",
      text: "Hi",
      html: "<p>Hi</p>",
    });
  });

  it("throws a delivery error with the status, never the key", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({ message: "Domain not verified" }, { status: 403 }),
    );
    const mailer = createResendMailer({
      apiKey: "re_secret_key",
      from: "hello@example.com",
      fetch: fetchMock as unknown as typeof fetch,
    });
    const error = await mailer.send(message).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(MailDeliveryError);
    expect((error as MailDeliveryError).status).toBe(403);
    expect((error as Error).message).toContain("Domain not verified");
    expect((error as Error).message).not.toContain("re_secret_key");
  });

  it("reports an unreachable provider", async () => {
    const mailer = createResendMailer({
      apiKey: "k",
      from: "hello@example.com",
      fetch: (async () => {
        throw new TypeError("fetch failed");
      }) as unknown as typeof fetch,
    });
    await expect(mailer.send(message)).rejects.toBeInstanceOf(MailDeliveryError);
  });
});

describe("recording mailer", () => {
  it("keeps messages in order, capped", async () => {
    const box = createMailbox(2);
    const mailer = createRecordingMailer(box);
    await mailer.send({ ...message, subject: "1" });
    await mailer.send({ ...message, subject: "2" });
    await mailer.send({ ...message, subject: "3" });
    expect(box.messages.map((m) => m.subject)).toEqual(["2", "3"]);
    box.clear();
    expect(box.messages).toEqual([]);
  });
});

describe("createMailer", () => {
  const resend = { RESEND_API_KEY: "re_x", EMAIL_FROM: "hello@example.com" };

  it("never records mail in production, even if DEV_MAILBOX is set", () => {
    expect(createMailer({ NODE_ENV: "production", DEV_MAILBOX: "true", ...resend }).kind).toBe(
      "resend",
    );
    expect(() => createMailer({ NODE_ENV: "production", DEV_MAILBOX: "true" })).toThrow();
  });

  it("records mail in development when the dev mailbox is on", () => {
    expect(createMailer({ NODE_ENV: "development", DEV_MAILBOX: "true", ...resend }).kind).toBe(
      "recording",
    );
    expect(createMailer({ NODE_ENV: "development", ...resend }).kind).toBe("resend");
  });
});

describe("renderEmailHtml", () => {
  it("escapes every value", () => {
    const html = renderEmailHtml({
      paragraphs: ["Hi <b>Amani</b> & co"],
      action: { label: "Open", url: 'https://example.com/?a=1&b="2"' },
    });
    expect(html).toContain("Hi &lt;b&gt;Amani&lt;/b&gt; &amp; co");
    expect(html).toContain('href="https://example.com/?a=1&amp;b=&quot;2&quot;"');
  });
});
