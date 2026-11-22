import { expect, test } from "@playwright/test";

test("staff app is excluded from search engines", async ({ page, request }) => {
  const res = await request.get("/");
  expect(res.headers()["x-robots-tag"]).toContain("noindex");

  await page.goto("/");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});

test("staff app exposes no data before sign-in exists", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Staff access is not available yet.")).toBeVisible();
  await expect(page.getByRole("link")).toHaveCount(0);
  await expect(page.getByRole("button")).toHaveCount(0);
});
