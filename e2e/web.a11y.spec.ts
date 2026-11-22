import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const WCAG = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

for (const colorScheme of ["light", "dark"] as const) {
  test.describe(`${colorScheme} mode`, () => {
    test.use({ colorScheme });

    test("home page has no WCAG A/AA violations", async ({ page }) => {
      await page.goto("/");
      const results = await new AxeBuilder({ page }).withTags(WCAG).analyze();
      expect(results.violations).toEqual([]);
    });

    test("home page follows the OS colour scheme", async ({ page }) => {
      await page.goto("/");
      const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
      expect(bg).toBe(colorScheme === "light" ? "rgb(243, 245, 242)" : "rgb(22, 18, 26)");
    });
  });
}

test("design system page renders both themes without WCAG violations", async ({ page }) => {
  const res = await page.goto("/design");
  expect(res?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 2, name: "Light" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Dark" })).toBeVisible();
  const results = await new AxeBuilder({ page }).withTags(WCAG).analyze();
  expect(results.violations).toEqual([]);
});

test("form fields are wired for screen readers", async ({ page }) => {
  await page.goto("/design");
  const email = page.locator("#light-email");
  await expect(email).toHaveAttribute("aria-invalid", "true");
  await expect(email).toHaveAttribute("required", "");
  await expect(email).toHaveAccessibleDescription(/name@example\.com/);
  await expect(page.locator("#light-bio")).not.toHaveAttribute("required");
  await expect(page.locator("#light-display-name")).toHaveAccessibleDescription(
    /how other members see you/,
  );
});

test("loading button blocks repeat presses and announces itself", async ({ page }) => {
  await page.goto("/design");
  const saving = page.locator('[data-theme="light"] button[aria-busy="true"]');
  await expect(saving).toBeDisabled();
  await expect(saving.getByRole("status")).toHaveText("Saving");
});

test("controls meet the 44px touch target", async ({ page }) => {
  await page.goto("/design");
  const box = await page.getByRole("button", { name: "Send message" }).first().boundingBox();
  expect(box?.height).toBeGreaterThanOrEqual(44);
  const input = await page.locator("#light-display-name").boundingBox();
  expect(input?.height).toBeGreaterThanOrEqual(44);
});
