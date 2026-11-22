import { schema } from "@kinora/db";
import { createTestDatabase, testDatabaseUrl } from "@kinora/db/testing";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createMailbox, createRecordingMailer, type EmailMessage } from "../email";
import { parseMarketList } from "../markets";
import { createAuth, REGISTRATION_ERRORS, type AuthEmailTemplates } from "./auth";
import { buildMemberExport } from "./export";
import {
  collectMemberData,
  joinWaitlist,
  purgeDeletedAccounts,
  requestAccountDeletion,
} from "./repository";

type TestDb = Awaited<ReturnType<typeof createTestDatabase>>;

const APP_URL = "http://localhost:3999";
const message = (to: string, subject: string, url: string): EmailMessage => ({
  to,
  subject,
  text: url,
  html: url,
});
const templates: AuthEmailTemplates = {
  verifyEmail: ({ to, url }) => message(to, "verify", url),
  resetPassword: ({ to, url }) => message(to, "reset", url),
  existingAccount: ({ to, signInUrl }) => message(to, "existing", signInUrl),
};

describe.skipIf(!testDatabaseUrl)("identity (integration)", () => {
  let t: TestDb;
  const mailbox = createMailbox();
  let auth: ReturnType<typeof createAuth>;
  let ipCounter = 0;
  const nextIp = () => `198.51.100.${++ipCounter}`;

  const call = (
    path: string,
    init: { method?: string; body?: unknown; cookie?: string; ip?: string } = {},
    instance = auth,
  ) =>
    instance.handler(
      new Request(`${APP_URL}/api/auth${path}`, {
        method: init.method ?? "POST",
        headers: {
          "content-type": "application/json",
          origin: APP_URL,
          "x-forwarded-for": init.ip ?? nextIp(),
          ...(init.cookie ? { cookie: init.cookie } : {}),
        },
        body: init.body === undefined ? undefined : JSON.stringify(init.body),
      }),
    );

  const lastMailTo = (to: string) => mailbox.messages.filter((m) => m.to === to).at(-1);
  const userByEmail = async (email: string) =>
    (await t.db.select().from(schema.authUser).where(eq(schema.authUser.email, email)))[0];

  const registration = (n: string, overrides: Record<string, unknown> = {}) => ({
    name: `Member ${n}`,
    email: `${n}@example.com`,
    password: "a long enough password",
    dateOfBirth: "1995-03-07",
    countryCode: "KE",
    ...overrides,
  });

  async function registerAndVerify(n: string) {
    const res = await call("/sign-up/email", { body: registration(n) });
    expect(res.status).toBe(200);
    const link = new URL(lastMailTo(`${n}@example.com`)!.text);
    const verified = await call(`/verify-email?token=${link.searchParams.get("token")}`, {
      method: "GET",
    });
    expect(verified.status).toBe(200);
    const user = await userByEmail(`${n}@example.com`);
    return user!;
  }

  async function signIn(n: string, password = "a long enough password", ip?: string) {
    return call("/sign-in/email", { body: { email: `${n}@example.com`, password }, ip });
  }

  beforeAll(async () => {
    t = await createTestDatabase();
    auth = createAuth({
      db: t.db,
      appUrl: APP_URL,
      secret: "integration-test-secret-integration-test-secret",
      secureCookies: false,
      markets: parseMarketList("KE"),
      mailer: createRecordingMailer(mailbox),
      emails: templates,
      now: () => new Date("2026-11-21T10:00:00Z"),
      logLevel: "error",
    });
  }, 60_000);
  afterAll(async () => {
    await t?.drop();
  });

  describe("registration", () => {
    it("creates the account and its profile, and emails a verification link to our page", async () => {
      const res = await call("/sign-up/email", { body: registration("amani") });
      expect(res.status).toBe(200);
      const user = await userByEmail("amani@example.com");
      expect(user?.emailVerified).toBe(false);
      const [profile] = await t.db
        .select()
        .from(schema.profiles)
        .where(eq(schema.profiles.userId, user!.id));
      expect(profile).toMatchObject({
        displayName: "Member amani",
        dateOfBirth: "1995-03-07",
        countryCode: "KE",
      });
      const mail = lastMailTo("amani@example.com");
      expect(mail?.subject).toBe("verify");
      expect(new URL(mail!.text).pathname).toBe("/verify-email");
    });

    it("rejects under-18s on the server, even when the API is called directly", async () => {
      const res = await call("/sign-up/email", {
        body: registration("young", { dateOfBirth: "2008-11-22" }),
      });
      expect(res.status).toBe(403);
      expect(((await res.json()) as { code?: string }).code).toBe(REGISTRATION_ERRORS.underAge);
      expect(await userByEmail("young@example.com")).toBeUndefined();
    });

    it("accepts someone who turns 18 today", async () => {
      const res = await call("/sign-up/email", {
        body: registration("birthday", { dateOfBirth: "2008-11-21" }),
      });
      expect(res.status).toBe(200);
    });

    it("refuses sign-up from a country that isn't open, and requires date of birth and country", async () => {
      const closed = await call("/sign-up/email", {
        body: registration("lagos", { countryCode: "NG" }),
      });
      expect(closed.status).toBe(403);
      expect(((await closed.json()) as { code?: string }).code).toBe(
        REGISTRATION_ERRORS.regionClosed,
      );
      const missing = await call("/sign-up/email", {
        body: { name: "No dob", email: "nodob@example.com", password: "a long enough password" },
      });
      expect(missing.status).toBe(400);
      expect(await userByEmail("lagos@example.com")).toBeUndefined();
      expect(await userByEmail("nodob@example.com")).toBeUndefined();
    });

    it("rejects passwords under 10 characters", async () => {
      const res = await call("/sign-up/email", {
        body: registration("shortpw", { password: "123456789" }),
      });
      expect(res.status).toBe(400);
    });

    it("answers a repeat sign-up exactly like a new one, and tells the owner by email", async () => {
      await call("/sign-up/email", { body: registration("repeat") });
      const again = await call("/sign-up/email", {
        body: registration("repeat", { password: "a different password" }),
      });
      expect(again.status).toBe(200);
      expect(lastMailTo("repeat@example.com")?.subject).toBe("existing");
      const users = await t.db
        .select()
        .from(schema.authUser)
        .where(eq(schema.authUser.email, "repeat@example.com"));
      expect(users).toHaveLength(1);
    });
  });

  describe("sign-in", () => {
    it("requires a verified email, then sets an httpOnly, SameSite=Lax session cookie", async () => {
      await call("/sign-up/email", { body: registration("wanjiru") });
      const early = await signIn("wanjiru");
      expect(early.status).toBe(403);
      expect(((await early.json()) as { code?: string }).code).toBe("EMAIL_NOT_VERIFIED");

      const link = new URL(lastMailTo("wanjiru@example.com")!.text);
      await call(`/verify-email?token=${link.searchParams.get("token")}`, { method: "GET" });
      const ok = await signIn("wanjiru");
      expect(ok.status).toBe(200);
      const cookie = ok.headers.get("set-cookie") ?? "";
      expect(cookie).toMatch(/^kn\.session_token=/);
      expect(cookie).toMatch(/HttpOnly/i);
      expect(cookie).toMatch(/SameSite=Lax/i);
      expect(cookie).not.toMatch(/Secure/i);
    });

    it("gives the same error for a wrong password and an unknown email", async () => {
      await registerAndVerify("kamau");
      const wrong = await signIn("kamau", "not the password");
      const unknown = await signIn("nobody", "not the password");
      expect(wrong.status).toBe(401);
      expect(unknown.status).toBe(401);
      expect(((await wrong.json()) as { code?: string }).code).toBe(
        ((await unknown.json()) as { code?: string }).code,
      );
    });

    it("rate-limits repeated sign-in attempts per IP, in the database", async () => {
      const limited = createAuth({
        db: t.db,
        appUrl: APP_URL,
        secret: "integration-test-secret-integration-test-secret",
        secureCookies: false,
        markets: parseMarketList("KE"),
        mailer: createRecordingMailer(mailbox),
        emails: templates,
        logLevel: "error",
      });
      const ip = "203.0.113.50";
      const statuses: number[] = [];
      for (let i = 0; i < 6; i++) {
        const res = await call(
          "/sign-in/email",
          { body: { email: "kamau@example.com", password: "wrong guess" }, ip },
          limited,
        );
        statuses.push(res.status);
      }
      expect(statuses.slice(0, 5)).toEqual([401, 401, 401, 401, 401]);
      expect(statuses[5]).toBe(429);
      const other = await call(
        "/sign-in/email",
        { body: { email: "kamau@example.com", password: "wrong guess" }, ip: "203.0.113.51" },
        limited,
      );
      expect(other.status).toBe(401);
      const rows = await t.pool.query(`SELECT count FROM rate_limit WHERE key = $1`, [
        `${ip}|/sign-in/email`,
      ]);
      expect(rows.rows[0]?.count).toBe(5);
    });
  });

  describe("account deletion", () => {
    it("revokes every session at once and is cancelled by signing in again", async () => {
      const user = await registerAndVerify("leaving");
      await signIn("leaving");
      await signIn("leaving");
      const before = await t.db
        .select()
        .from(schema.authSession)
        .where(eq(schema.authSession.userId, user.id));
      expect(before.length).toBe(2);

      const result = await requestAccountDeletion(t.db, user.id, new Date());
      expect(result.status).toBe("requested");
      const after = await t.db
        .select()
        .from(schema.authSession)
        .where(eq(schema.authSession.userId, user.id));
      expect(after).toEqual([]);

      expect((await signIn("leaving")).status).toBe(200);
      const [profile] = await t.db
        .select()
        .from(schema.profiles)
        .where(eq(schema.profiles.userId, user.id));
      expect(profile?.deletionRequestedAt).toBeNull();
      const audit = await t.db
        .select()
        .from(schema.auditLogs)
        .where(eq(schema.auditLogs.targetId, user.id));
      expect(audit.map((a) => a.action)).toEqual([
        "account.deletion_request",
        "account.deletion_cancel",
      ]);
    });

    it("purges accounts past the grace period, writes a system audit entry, and keeps the rest", async () => {
      const now = new Date("2026-11-21T10:00:00Z");
      const due = await registerAndVerify("due");
      const recent = await registerAndVerify("recent");
      const day = 24 * 60 * 60 * 1000;
      await requestAccountDeletion(t.db, due.id, new Date(now.getTime() - 30 * day));
      await requestAccountDeletion(t.db, recent.id, new Date(now.getTime() - 29 * day));
      // A reset token that must disappear with the account.
      await t.db.insert(schema.authVerification).values({
        id: "reset_due",
        identifier: "reset-password:abc",
        value: due.id,
        expiresAt: new Date(now.getTime() + day),
      });

      const { purged } = await purgeDeletedAccounts(t.db, { now, graceDays: 30 });
      expect(purged).toEqual([due.id]);

      expect(await userByEmail("due@example.com")).toBeUndefined();
      expect(
        await t.db.select().from(schema.profiles).where(eq(schema.profiles.userId, due.id)),
      ).toEqual([]);
      expect(
        await t.db
          .select()
          .from(schema.authVerification)
          .where(eq(schema.authVerification.id, "reset_due")),
      ).toEqual([]);
      expect(await userByEmail("recent@example.com")).toBeDefined();

      const [entry] = await t.db
        .select()
        .from(schema.auditLogs)
        .where(eq(schema.auditLogs.action, "account.purge"));
      expect(entry).toMatchObject({
        actorType: "system",
        actorId: null,
        targetType: "user",
        targetId: due.id,
        metadata: { graceDays: 30 },
      });
      expect(JSON.stringify(entry?.metadata)).not.toContain("@");

      // Running it again does nothing more.
      expect((await purgeDeletedAccounts(t.db, { now, graceDays: 30 })).purged).toEqual([]);
    });
  });

  describe("data export", () => {
    it("contains only the caller's own rows", async () => {
      const a = await registerAndVerify("export_a");
      const b = await registerAndVerify("export_b");
      await signIn("export_a");
      await signIn("export_b");
      const [profileB] = await t.db
        .select()
        .from(schema.profiles)
        .where(eq(schema.profiles.userId, b.id));
      await t.db.insert(schema.profilePhotos).values({
        profileId: profileB!.id,
        storageKey: "k/b/0",
        position: 0,
        contentType: "image/png",
        byteSize: 10,
        width: 1,
        height: 1,
      });

      const rows = await collectMemberData(t.db, a.id);
      expect(rows).not.toBeNull();
      const exported = buildMemberExport(rows!, new Date());
      expect(exported.account.email).toBe("export_a@example.com");
      expect(exported.profile?.displayName).toBe("Member export_a");
      expect(exported.photos).toEqual([]);
      expect(exported.account.sessions).toHaveLength(1);
      const json = JSON.stringify(exported);
      expect(json).not.toContain(b.id);
      expect(json).not.toContain("export_b");
      expect(json).not.toContain(profileB!.id);
    });

    it("returns nothing for an unknown user", async () => {
      expect(await collectMemberData(t.db, "missing")).toBeNull();
    });
  });

  describe("waitlist", () => {
    it("stores one lower-case entry per email, silently ignoring repeats", async () => {
      await joinWaitlist(t.db, { email: " Lagos@Example.com ", countryCode: "NG" });
      await joinWaitlist(t.db, { email: "lagos@example.com", countryCode: "NG" });
      const rows = await t.db.select().from(schema.waitlistEntries);
      expect(rows.map((r) => [r.email, r.countryCode])).toEqual([["lagos@example.com", "NG"]]);
    });
  });
});
