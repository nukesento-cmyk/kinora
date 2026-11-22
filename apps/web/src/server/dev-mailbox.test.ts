import { describe, expect, it } from "vitest";
import { email } from "@kinora/core";
import { devMailboxResponse } from "./dev-mailbox";

const box = () => {
  const mailbox = email.createMailbox();
  mailbox.record({ to: "a@example.com", subject: "A", text: "link-a", html: "" });
  mailbox.record({ to: "b@example.com", subject: "B", text: "link-b", html: "" });
  return mailbox;
};
const get = (q = "") => new Request(`http://localhost/api/dev/mailbox${q}`);

describe("devMailboxResponse", () => {
  it("is a 404 in production, whatever DEV_MAILBOX says", async () => {
    const res = devMailboxResponse(get(), { NODE_ENV: "production", DEV_MAILBOX: "true" }, box());
    expect(res.status).toBe(404);
    expect(await res.text()).not.toContain("link-a");
  });

  it("is a 404 unless DEV_MAILBOX is exactly 'true'", () => {
    for (const DEV_MAILBOX of [undefined, "", "false", "1", "TRUE"]) {
      expect(
        devMailboxResponse(get(), { NODE_ENV: "development", DEV_MAILBOX }, box()).status,
      ).toBe(404);
    }
  });

  it("lists recorded messages outside production, optionally for one address", async () => {
    const env = { NODE_ENV: "test", DEV_MAILBOX: "true" };
    const all = await devMailboxResponse(get(), env, box()).json();
    expect(all.messages).toHaveLength(2);
    const one = await devMailboxResponse(get("?to=B@example.com"), env, box()).json();
    expect(one.messages.map((m: { subject: string }) => m.subject)).toEqual(["B"]);
  });

  it("can be emptied", () => {
    const mailbox = box();
    const res = devMailboxResponse(
      new Request("http://localhost/api/dev/mailbox", { method: "DELETE" }),
      { NODE_ENV: "development", DEV_MAILBOX: "true" },
      mailbox,
    );
    expect(res.status).toBe(204);
    expect(mailbox.messages).toEqual([]);
  });
});
