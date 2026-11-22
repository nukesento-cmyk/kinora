import { expect, test } from "@playwright/test";
import {
  alerts,
  fillRegistration,
  isolateClientIp,
  linkIn,
  PASSWORD,
  registerVerified,
  signIn,
  uniqueEmail,
  waitForMail,
} from "./support/auth";

test.beforeEach(async ({ context }) => {
  await isolateClientIp(context);
});

test("register, verify by email, sign in, see sessions, sign out", async ({ page }) => {
  const email = uniqueEmail("flow");
  await fillRegistration(page, { email, displayName: "Wanjiru" });
  await expect(page).toHaveURL(/\/verify-email\?sent=1$/);

  // Signing in before confirming the email doesn't complete.
  await signIn(page, email);
  await expect(
    page.getByText(`Confirm your email address first. We've sent a new link to ${email}.`),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/login/);

  const mail = await waitForMail(page.request, email, /Confirm your email/);
  expect(mail.text).toContain("Hi Wanjiru,");
  await page.goto(linkIn(mail, "/verify-email"));
  await page.getByRole("button", { name: "Confirm email address" }).click();
  await expect(page.getByText("Email address confirmed")).toBeVisible();

  await page.getByRole("link", { name: "Sign in" }).click();
  await signIn(page, email);
  await expect(page).toHaveURL(/\/account\/security$/);
  await expect(page.getByRole("heading", { level: 1, name: "Security" })).toBeVisible();
  await expect(page.getByTestId("session-current")).toContainText("This device");
  await expect(page.getByText("You're only signed in on this device.")).toBeVisible();

  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page).toHaveURL(/\/login\?notice=signed-out$/);
  await expect(page.getByText("You've been signed out.")).toBeVisible();
  await page.goto("/account/security");
  await expect(page).toHaveURL(/\/login\?next=%2Faccount%2Fsecurity$/);
});

test("under-18s are turned away on the server and nothing is kept", async ({ page }) => {
  const now = new Date();
  // Turns 18 tomorrow (UTC).
  const tomorrow = new Date(
    Date.UTC(now.getUTCFullYear() - 18, now.getUTCMonth(), now.getUTCDate() + 1),
  );
  const email = uniqueEmail("young");
  await fillRegistration(page, {
    email,
    dob: {
      day: String(tomorrow.getUTCDate()),
      month: String(tomorrow.getUTCMonth() + 1),
      year: String(tomorrow.getUTCFullYear()),
    },
  });
  await expect(alerts(page)).toContainText("You need to be 18 or older to join");
  await expect(page.getByText("We haven't kept any of the details you entered.")).toBeVisible();
  const res = await page.request.get(`/api/dev/mailbox?to=${encodeURIComponent(email)}`);
  expect((await res.json()).messages).toEqual([]);
});

test("someone outside the launch markets joins the waitlist instead", async ({ page }) => {
  const email = uniqueEmail("waitlist");
  await fillRegistration(page, { email, country: "NG" });
  await expect(page.getByText("Registration isn't open in Nigeria yet")).toBeVisible();
  await expect(
    page.getByText(`We've added ${email} to the waitlist.`, { exact: false }),
  ).toBeVisible();
  // No account was created, so signing in fails like any wrong password.
  await signIn(page, email);
  await expect(
    page.getByText("The email address or password is incorrect.", { exact: false }),
  ).toBeVisible();
});

test("invalid input is explained field by field", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("Email address").fill("amani@");
  await page.getByLabel("Password", { exact: true }).fill("short");
  await page.getByLabel("Day").fill("31");
  await page.getByLabel("Month").fill("2");
  await page.getByLabel("Year").fill("1995");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(alerts(page)).toContainText("Some details need changing");
  await expect(page.getByLabel("Display name")).toHaveAccessibleDescription(
    /Enter the name other members will see/,
  );
  await expect(page.getByLabel("Email address")).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByLabel("Email address")).toHaveValue("amani@");
  await expect(page.getByLabel("Password", { exact: true })).toHaveAccessibleDescription(
    /at least 10 characters/,
  );
  await expect(page.getByLabel("Day")).toHaveAccessibleDescription(/Enter a real date/);
  await expect(page.getByLabel("Country you live in")).toHaveAccessibleDescription(
    /Choose the country/,
  );
});

test("a wrong password and an unknown email get the same generic error", async ({ page }) => {
  const email = uniqueEmail("wrongpw");
  await registerVerified(page, { email });
  const generic = "The email address or password is incorrect. Check them and try again.";
  await signIn(page, email, "not the right password");
  await expect(alerts(page)).toHaveText(generic);
  await expect(page.getByLabel("Email address")).toHaveValue(email);
  await signIn(page, uniqueEmail("nobody"), "not the right password");
  await expect(alerts(page)).toHaveText(generic);
});

test("forgot and reset password", async ({ page }) => {
  const email = uniqueEmail("reset");
  await registerVerified(page, { email });

  await page.goto("/forgot-password");
  await page.getByLabel("Email address").fill(email);
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.getByText(`If an account exists for ${email}`, { exact: false })).toBeVisible();

  // Unknown addresses get exactly the same answer.
  const stranger = uniqueEmail("stranger");
  await page.goto("/forgot-password");
  await page.getByLabel("Email address").fill(stranger);
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(
    page.getByText(`If an account exists for ${stranger}`, { exact: false }),
  ).toBeVisible();

  const mail = await waitForMail(page.request, email, /Reset your/);
  await page.goto(linkIn(mail, "/reset-password"));
  const newPassword = "an even longer new passphrase";
  await page.getByLabel("New password", { exact: true }).fill(newPassword);
  await page.getByLabel("Type the new password again").fill(newPassword);
  await page.getByRole("button", { name: "Change password" }).click();
  await expect(page).toHaveURL(/\/login\?notice=password-changed$/);
  await expect(page.getByText("Your password has been changed.", { exact: false })).toBeVisible();

  await signIn(page, email, PASSWORD);
  await expect(alerts(page)).toContainText("incorrect");
  await signIn(page, email, newPassword);
  await expect(page).toHaveURL(/\/account\/security$/);

  // The link only works once.
  await page.goto(linkIn(mail, "/reset-password"));
  await page.getByLabel("New password", { exact: true }).fill("yet another passphrase");
  await page.getByLabel("Type the new password again").fill("yet another passphrase");
  await page.getByRole("button", { name: "Change password" }).click();
  await expect(
    page.getByText("This reset link has expired or has already been used"),
  ).toBeVisible();
});

test("signing out another device and changing the password", async ({ page, browser }) => {
  const email = uniqueEmail("devices");
  await registerVerified(page, { email });
  const other = await browser.newContext();
  await isolateClientIp(other);
  const otherPage = await other.newPage();
  await signIn(otherPage, email);
  await expect(otherPage).toHaveURL(/\/account\/security$/);
  await signIn(page, email);

  await expect(page.getByTestId("session-other")).toHaveCount(1);
  await page.getByRole("button", { name: /^Sign out this device/ }).click();
  await expect(page.getByText("That device has been signed out.")).toBeVisible();
  await expect(page.getByTestId("session-other")).toHaveCount(0);
  await otherPage.reload();
  await expect(otherPage).toHaveURL(/\/login\?next=/);

  await page.getByLabel("Current password").fill("wrong current password");
  await page.getByLabel("New password", { exact: true }).fill("a brand new passphrase");
  await page.getByLabel("Type the new password again").fill("a brand new passphrase");
  await page.getByRole("button", { name: "Change password" }).click();
  await expect(page.getByText("That password is incorrect.", { exact: false })).toBeVisible();
  await page.getByLabel("Current password").fill(PASSWORD);
  await page.getByLabel("New password", { exact: true }).fill("a brand new passphrase");
  await page.getByLabel("Type the new password again").fill("a brand new passphrase");
  await page.getByRole("button", { name: "Change password" }).click();
  await expect(
    page.getByText("Your password has been changed and your other devices", { exact: false }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Sign out everywhere" }).click();
  await expect(page).toHaveURL(/\/login\?notice=signed-out-everywhere$/);
  await other.close();
});

test("deleting an account signs out everywhere and starts the grace period", async ({ page }) => {
  const email = uniqueEmail("delete");
  await registerVerified(page, { email });
  await signIn(page, email);
  await page.getByRole("link", { name: "Delete account" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Delete your account" })).toBeVisible();
  await expect(
    page.getByText("For 30 days you can change your mind", { exact: false }),
  ).toBeVisible();

  await page.getByLabel("Enter your password to confirm").fill("not my password");
  await page.getByRole("button", { name: "Delete my account" }).click();
  await expect(
    page.getByText("That password is incorrect. Your account hasn't been changed."),
  ).toBeVisible();

  await page.getByLabel("Enter your password to confirm").fill(PASSWORD);
  await page.getByRole("button", { name: "Delete my account" }).click();
  await expect(page).toHaveURL(/\/login\?notice=deletion-requested$/);
  await expect(
    page.getByText("Your account will be deleted in 30 days", { exact: false }),
  ).toBeVisible();
  expect((await page.context().cookies()).some((c) => c.name.includes("session_token"))).toBe(
    false,
  );
  await page.goto("/account/security");
  await expect(page).toHaveURL(/\/login\?next=/);
});

test("the data export holds only the caller's own data", async ({ page, browser }) => {
  const mine = uniqueEmail("export-a");
  const theirs = uniqueEmail("export-b");
  await registerVerified(page, { email: mine, displayName: "Akinyi" });

  const other = await browser.newContext();
  await isolateClientIp(other);
  const otherPage = await other.newPage();
  await registerVerified(otherPage, { email: theirs, displayName: "Otieno" });
  await signIn(otherPage, theirs);

  await signIn(page, mine);
  await page.goto("/account/export");
  await expect(page.getByRole("link", { name: "Download my data" })).toBeVisible();
  const res = await page.request.get("/account/export/download");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-disposition"]).toMatch(
    /^attachment; filename=".+-data-\d{4}-\d{2}-\d{2}\.json"$/,
  );
  expect(res.headers()["cache-control"]).toContain("no-store");
  const body = await res.text();
  const data = JSON.parse(body);
  expect(data.account.email).toBe(mine);
  expect(data.profile.displayName).toBe("Akinyi");
  expect(data.profile.countryCode).toBe("KE");
  expect(body).not.toContain(theirs);
  expect(body).not.toContain("Otieno");
  expect(body).not.toMatch(/"(password|token)"/);

  // Signed out, there's nothing to download.
  const anonymous = await other.request.get("/account/export/download", {
    headers: { cookie: "" },
    maxRedirects: 0,
  });
  expect([302, 307, 401]).toContain(anonymous.status());
  await other.close();
});

test("account pages redirect to sign-in when signed out", async ({ page, request }) => {
  for (const path of ["/account", "/account/security", "/account/delete", "/account/export"]) {
    await page.goto(path);
    await expect(page).toHaveURL(
      new RegExp(`/login\\?next=${encodeURIComponent(path).replace(/\//g, "%2F")}`),
    );
    await expect(page.getByRole("heading", { level: 1, name: "Sign in" })).toBeVisible();
  }
  const download = await request.get("/account/export/download", { maxRedirects: 0 });
  expect(download.status()).toBe(307);
  // A forged cookie gets past the proxy's quick check, but not the server-side session check.
  const forged = await request.get("/account/security", {
    headers: { cookie: "kn.session_token=forged.value" },
    maxRedirects: 0,
  });
  expect(forged.status()).toBeGreaterThanOrEqual(300);
  expect(forged.status()).toBeLessThan(400);
  expect(forged.headers().location).toContain("/login?next=");
});

test("the session cookie is httpOnly and SameSite=Lax", async ({ page, context }) => {
  const email = uniqueEmail("cookie");
  await registerVerified(page, { email });
  await signIn(page, email);
  await expect(page).toHaveURL(/\/account\/security$/);
  const cookie = (await context.cookies()).find((c) => c.name.endsWith("kn.session_token"));
  expect(cookie).toBeDefined();
  expect(cookie?.httpOnly).toBe(true);
  expect(cookie?.sameSite).toBe("Lax");
  expect(cookie?.path).toBe("/");
  // Secure is on whenever NODE_ENV=production or APP_URL is https (unit-tested); this
  // e2e server runs over plain http in test mode.
  expect(cookie?.expires).toBeGreaterThan(Date.now() / 1000);
  expect(await page.evaluate(() => document.cookie)).not.toContain("session_token");
});

test("repeated failed sign-ins are rate limited", async ({ page }) => {
  const email = uniqueEmail("ratelimit");
  for (let i = 0; i < 5; i++) {
    await signIn(page, email, `wrong guess ${i}`);
    await expect(alerts(page)).toContainText("incorrect");
  }
  await signIn(page, email, "wrong guess 6");
  await expect(alerts(page)).toHaveText("Too many attempts. Wait a minute, then try again.");
});

test("Google sign-in is hidden when it isn't configured", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible();
  await expect(page.getByText("Continue with Google")).toHaveCount(0);
});

test("pages carry a nonce-based Content-Security-Policy and run without violations", async ({
  page,
}) => {
  const violations: string[] = [];
  page.on("console", (msg) => {
    if (/Content Security Policy|Refused to/i.test(msg.text())) violations.push(msg.text());
  });
  const res = await page.goto("/register");
  const csp = res?.headers()["content-security-policy"] ?? "";
  expect(csp).toMatch(/script-src 'self' 'nonce-[A-Za-z0-9+/=]+' 'strict-dynamic'/);
  expect(csp).not.toContain("unsafe-eval");
  expect(csp).toContain("frame-ancestors 'none'");
  const second = await page.request.get("/register");
  expect(second.headers()["content-security-policy"]).not.toBe(csp);
  // Hydration works under the policy: the submit button shows its pending state.
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(alerts(page)).toBeVisible();
  for (const path of ["/login", "/forgot-password", "/verify-email", "/"]) await page.goto(path);
  expect(violations).toEqual([]);
});
