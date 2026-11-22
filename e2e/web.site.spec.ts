import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Every public page of the website (milestone 1.8). Registration and sign-in belong to
// the authentication milestone and are only linked to from here.
const pages = [
  "/",
  "/about",
  "/discover",
  "/dating",
  "/community",
  "/events",
  "/stories",
  "/safety",
  "/membership",
  "/help",
  "/contact",
  "/privacy",
  "/terms",
  "/community-guidelines",
];
const legalPages = ["/privacy", "/terms", "/community-guidelines"];
const authPaths = ["/register", "/login"];
const WCAG = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22a", "wcag22aa"];

for (const colorScheme of ["light", "dark"] as const) {
  test.describe(`${colorScheme} mode`, () => {
    test.use({ colorScheme });

    for (const path of pages) {
      test(`${path} renders with one h1 and no WCAG A/AA violations`, async ({ page }) => {
        const res = await page.goto(path);
        expect(res?.status()).toBe(200);
        await expect(page.locator("h1")).toHaveCount(1);
        await expect(page.locator("main#content")).toHaveCount(1);
        const results = await new AxeBuilder({ page }).withTags(WCAG).analyze();
        expect(results.violations).toEqual([]);
      });
    }
  });
}

test("no page claims a member count", async ({ page }) => {
  for (const path of pages) {
    await page.goto(path);
    const text = await page.locator("body").innerText();
    expect(text, path).not.toMatch(/\d[\d,.\s]*\+?\s*members/i);
  }
});

test("every internal link resolves", async ({ page, request }) => {
  const hrefs = new Set<string>();
  for (const path of pages) {
    await page.goto(path);
    const found = await page
      .locator("a[href]")
      .evaluateAll((links) => links.map((a) => (a as HTMLAnchorElement).href));
    for (const href of found) {
      const url = new URL(href);
      if (url.origin === new URL(page.url()).origin) hrefs.add(url.pathname);
    }
  }
  // Registration and sign-in are linked from the header and calls to action.
  for (const auth of authPaths) expect(hrefs.has(auth), auth).toBe(true);
  for (const path of hrefs) {
    if (authPaths.includes(path)) continue;
    const res = await request.get(path);
    expect(res.status(), path).toBe(200);
  }
});

test("legal pages are marked as drafts under legal review", async ({ page }) => {
  for (const path of legalPages) {
    await page.goto(path);
    const notice = page.getByText("Draft — under legal review");
    await expect(notice, path).toBeVisible();
    // The notice comes before the page's heading.
    const [noticeBox, h1Box] = await Promise.all([
      notice.boundingBox(),
      page.locator("h1").boundingBox(),
    ]);
    expect(noticeBox!.y, path).toBeLessThan(h1Box!.y);
  }
});

test("legal drafts say the company details are to be confirmed when unset", async ({ page }) => {
  await page.goto("/privacy");
  await expect(page.getByText(/is to be confirmed/).first()).toBeVisible();
});

test("membership shows no prices unless configured", async ({ page }) => {
  await page.goto("/membership");
  await expect(page.getByRole("heading", { level: 2, name: "Free" })).toBeVisible();
  await expect(page.getByText("Price to be announced.")).toHaveCount(2);
  const text = await page.locator("main").innerText();
  expect(text).not.toMatch(/[$€£]|\bKES\b|\bUSD\b|a month in/);
});

test("contact page shows no address or form when none is configured", async ({ page }) => {
  await page.goto("/contact");
  await expect(page.locator('a[href^="mailto:"]')).toHaveCount(0);
  await expect(page.locator("form")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Help and FAQs" }).first()).toBeVisible();
});

test("stories page explains consent and shows no stories", async ({ page }) => {
  await page.goto("/stories");
  await expect(page.getByRole("heading", { name: "Shared only with consent" })).toBeVisible();
  await expect(page.getByText("No stories yet")).toBeVisible();
});

test("illustrations of people are labelled as invented", async ({ page }) => {
  for (const path of ["/", "/discover", "/dating"]) {
    await page.goto(path);
    await expect(page.getByText("The people shown are invented").first(), path).toBeVisible();
  }
});

test("skip link moves focus to the main content", async ({ page }) => {
  await page.goto("/about");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to content" });
  await expect(skip).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#content$/);
});

test("header navigation works with the keyboard", async ({ page, isMobile }) => {
  test.skip(isMobile, "The full header nav is for wide screens; the menu test covers mobile.");
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Main" });
  const discover = nav.getByRole("link", { name: "Discover" });
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press("Tab");
    if (await discover.evaluate((el) => el === document.activeElement)) break;
  }
  await expect(discover).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(nav.getByRole("link", { name: "Dating" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/dating$/);
  await expect(
    page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Dating" }),
  ).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("link", { name: "Join", exact: true })).toHaveAttribute(
    "href",
    "/register",
  );
  await expect(page.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login");
});

test("mobile menu opens, closes with Escape and returns focus", async ({ page, isMobile }) => {
  test.skip(!isMobile, "The menu button only appears on small screens.");
  await page.goto("/");
  const button = page.getByRole("button", { name: "Menu" });
  const menu = page.getByRole("navigation", { name: "Site menu" });
  await expect(button).toHaveAttribute("aria-expanded", "false");
  await expect(menu).toBeHidden();

  await button.focus();
  await page.keyboard.press("Enter");
  await expect(button).toHaveAttribute("aria-expanded", "true");
  await expect(menu).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(menu.getByRole("link", { name: "Discover" })).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(button).toHaveAttribute("aria-expanded", "false");
  await expect(button).toBeFocused();

  // Following a link closes the menu.
  await button.click();
  await menu.getByRole("link", { name: "Safety" }).click();
  await expect(page).toHaveURL(/\/safety$/);
  await expect(menu).toBeHidden();
});

test("robots.txt keeps private paths out of search and points to the sitemap", async ({
  request,
}) => {
  const res = await request.get("/robots.txt");
  expect(res.ok()).toBe(true);
  const body = await res.text();
  for (const path of ["/design", "/account", "/api"]) {
    expect(body).toContain(`Disallow: ${path}`);
  }
  expect(body).toMatch(/Sitemap: https?:\/\/\S+\/sitemap\.xml/);
});

test("sitemap lists every public page and nothing private", async ({ request }) => {
  const res = await request.get("/sitemap.xml");
  expect(res.ok()).toBe(true);
  const locs = [...(await res.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    (m) => new URL(m[1]!).pathname,
  );
  expect(locs.sort()).toEqual([...pages].sort());
});

test("each page has its own title and description", async ({ page }) => {
  const titles = new Set<string>();
  for (const path of pages) {
    await page.goto(path);
    titles.add(await page.title());
    await expect(page.locator('meta[name="description"]'), path).toHaveAttribute(
      "content",
      /.{40,}/,
    );
  }
  expect(titles.size).toBe(pages.length);
});
