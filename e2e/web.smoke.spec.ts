import { expect, test } from "@playwright/test";

test("home page shows the configured brand and launch market", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/\S+/);
  await expect(page.getByText("Registration opens first in Kenya.").first()).toBeVisible();
});

test("responses carry the baseline security headers", async ({ request }) => {
  const res = await request.get("/");
  const h = res.headers();
  expect(h["x-frame-options"]).toBe("DENY");
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["permissions-policy"]).toContain("geolocation=()");
  expect(h["x-powered-by"]).toBeUndefined();
});

test("health endpoint is up and reveals no configuration", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.ok()).toBe(true);
  expect(await res.json()).toEqual({ status: "ok", service: "web" });
});
