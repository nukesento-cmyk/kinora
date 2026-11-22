import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { alerts, isolateClientIp, registerVerified, signIn, uniqueEmail } from "./support/auth";

const WCAG = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

async function expectNoViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(WCAG).analyze();
  expect(results.violations).toEqual([]);
}

test.beforeEach(async ({ context }) => {
  await isolateClientIp(context);
});

for (const colorScheme of ["light", "dark"] as const) {
  test.describe(`auth pages, ${colorScheme} mode`, () => {
    test.use({ colorScheme });

    test("public auth pages have no WCAG A/AA violations", async ({ page }) => {
      for (const path of [
        "/register",
        "/login",
        "/login?notice=signed-out",
        "/forgot-password",
        "/verify-email",
        "/verify-email?token=example",
        "/reset-password",
        "/reset-password?token=example",
      ]) {
        await page.goto(path);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        await expectNoViolations(page);
      }
    });

    test("error states have no WCAG A/AA violations", async ({ page }) => {
      await page.goto("/register");
      await page.getByRole("button", { name: "Create account" }).click();
      await expect(alerts(page)).toBeVisible();
      await expectNoViolations(page);
      await page.goto("/login");
      await page.getByLabel("Email address").fill(uniqueEmail("a11y-nobody"));
      await page.getByLabel("Password", { exact: true }).fill("wrong password");
      await page.getByRole("button", { name: "Sign in", exact: true }).click();
      await expect(alerts(page)).toBeVisible();
      await expectNoViolations(page);
    });

    test("account pages have no WCAG A/AA violations", async ({ page }) => {
      const email = uniqueEmail(`a11y-${colorScheme}`);
      await registerVerified(page, { email });
      await signIn(page, email);
      for (const path of ["/account/security", "/account/export", "/account/delete"]) {
        await page.goto(path);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        await expectNoViolations(page);
      }
    });
  });
}

test("auth controls meet the 44px touch target", async ({ page }) => {
  await page.goto("/register");
  for (const control of [
    page.getByLabel("Display name"),
    page.getByLabel("Day"),
    page.getByLabel("Country you live in"),
    page.getByRole("button", { name: "Create account" }),
  ]) {
    const box = await control.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }
  await page.goto("/login");
  const forgot = await page.getByRole("link", { name: "Forgot your password?" }).boundingBox();
  expect(forgot?.height).toBeGreaterThanOrEqual(44);
});

test("the sign-in form works with the keyboard alone", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email address").focus();
  await page.keyboard.type(uniqueEmail("keyboard"));
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Password", { exact: true })).toBeFocused();
  await page.keyboard.type("some password");
  await page.keyboard.press("Enter");
  await expect(alerts(page)).toBeVisible();
});
