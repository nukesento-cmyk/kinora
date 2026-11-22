import { expect, type APIRequestContext, type BrowserContext, type Page } from "@playwright/test";

/**
 * Helpers for the auth e2e tests. Each test gets its own client IP (x-forwarded-for),
 * so Better Auth's per-IP rate limits don't make parallel tests interfere.
 */
export async function isolateClientIp(context: BrowserContext): Promise<string> {
  const ip = `10.${rand(255)}.${rand(255)}.${1 + rand(253)}`;
  await context.setExtraHTTPHeaders({ "x-forwarded-for": ip });
  return ip;
}

const rand = (n: number) => Math.floor(Math.random() * (n + 1));

export const PASSWORD = "a long and memorable phrase";

export function uniqueEmail(tag: string): string {
  return `e2e-${tag}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

interface Mail {
  to: string;
  subject: string;
  text: string;
}

/** Wait for the newest email to `to` whose subject matches, from the dev mailbox. */
export async function waitForMail(
  request: APIRequestContext,
  to: string,
  subject: RegExp,
): Promise<Mail> {
  let found: Mail | undefined;
  await expect
    .poll(
      async () => {
        const res = await request.get(`/api/dev/mailbox?to=${encodeURIComponent(to)}`);
        const { messages } = (await res.json()) as { messages: Mail[] };
        found = messages.filter((m) => subject.test(m.subject)).at(-1);
        return Boolean(found);
      },
      { timeout: 10_000 },
    )
    .toBe(true);
  return found!;
}

/** The first link in an email to one of our pages. */
export function linkIn(mail: Mail, path: string): string {
  const match = mail.text.match(new RegExp(`https?://[^\\s]+${path}\\?token=[^\\s]+`));
  if (!match) throw new Error(`No ${path} link in email "${mail.subject}"`);
  const url = new URL(match[0]);
  return `${url.pathname}${url.search}`;
}

export interface Registration {
  displayName?: string;
  email: string;
  password?: string;
  dob?: { day: string; month: string; year: string };
  country?: string;
}

export async function fillRegistration(page: Page, r: Registration): Promise<void> {
  await page.goto("/register");
  await page.getByLabel("Display name").fill(r.displayName ?? "Amani");
  await page.getByLabel("Email address").fill(r.email);
  await page.getByLabel("Password", { exact: true }).fill(r.password ?? PASSWORD);
  const dob = r.dob ?? { day: "7", month: "3", year: "1995" };
  await page.getByLabel("Day").fill(dob.day);
  await page.getByLabel("Month").fill(dob.month);
  await page.getByLabel("Year").fill(dob.year);
  await page.getByLabel("Country you live in").selectOption(r.country ?? "KE");
  await page.getByRole("button", { name: "Create account" }).click();
}

/** Register, open the verification link from the dev mailbox and confirm. */
export async function registerVerified(page: Page, r: Registration): Promise<void> {
  await fillRegistration(page, r);
  await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible();
  const mail = await waitForMail(page.request, r.email, /Confirm your email/);
  await page.goto(linkIn(mail, "/verify-email"));
  await page.getByRole("button", { name: "Confirm email address" }).click();
  await expect(page.getByText("Email address confirmed")).toBeVisible();
}

export async function signIn(page: Page, email: string, password = PASSWORD): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  // Wait for the server action's response: it carries the session cookie on success.
  await Promise.all([
    page.waitForResponse(
      (r) => r.request().method() === "POST" && new URL(r.url()).pathname === "/login",
    ),
    page.getByRole("button", { name: "Sign in", exact: true }).click(),
  ]);
}

/** Alerts on the page, leaving out Next.js's (empty) route announcer. */
export function alerts(page: Page) {
  return page.locator('[role="alert"]:not(#__next-route-announcer__)');
}
