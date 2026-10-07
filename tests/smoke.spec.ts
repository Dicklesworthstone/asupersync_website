import { expect, test, type Page } from "@playwright/test";

// Every regression this suite targets was real at some point: hydration
// mismatches, framer-motion warnings, a spec viewer that re-rendered ~200
// times a second, Tailwind grid classes that silently collapsed a layout, and
// router navigations that never committed.

const ROUTES = ["/", "/atp", "/showcase", "/architecture", "/spec-explorer", "/getting-started", "/glossary"];

/** Collects console errors and warnings for the duration of a test. */
function watchConsole(page: Page): string[] {
  const problems: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error" || msg.type() === "warning") problems.push(`${msg.type()}: ${msg.text()}`);
  });
  page.on("pageerror", (err) => problems.push(`pageerror: ${err.message}`));
  return problems;
}

/** Scrolls through the page so lazily mounted demos render too. */
async function scrollThrough(page: Page) {
  const height = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < height; y += 800) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(60);
  }
}

/** Resolves only if the main thread answers within the deadline. */
async function expectResponsive(page: Page, ms = 2_000) {
  const answer = await Promise.race([
    page.evaluate(() => "ok"),
    new Promise<string>((resolve) => setTimeout(() => resolve("frozen"), ms)),
  ]);
  expect(answer).toBe("ok");
}

for (const route of ROUTES) {
  test(`${route} renders cleanly at desktop and phone widths`, async ({ page }) => {
    const problems = watchConsole(page);
    for (const width of [1400, 390]) {
      await page.setViewportSize({ width, height: 900 });
      const response = await page.goto(route, { waitUntil: "networkidle" });
      expect(response?.ok()).toBe(true);
      await expect(page.locator("h1").first()).toBeVisible();
      await scrollThrough(page);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `horizontal overflow at ${width}px`).toBeLessThanOrEqual(1);
    }
    expect(problems).toEqual([]);
  });
}

test("spec explorer: deep link opens a doc at a heading, and navigation is URL-driven", async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 900 });
  await page.goto("/spec-explorer?doc=integration#tokio-migration-playbook");

  // The doc renders once per layout; the desktop copy is the visible one.
  const heading = page.locator('[id="tokio-migration-playbook"]').last();
  await expect(heading).toBeInViewport();

  // Two-column desktop layout (a comma in the grid class once collapsed it).
  const sidebarWidth = await page.locator('button:has-text("Graduated On-Ramp")').last().evaluate((el) => el.getBoundingClientRect().width);
  expect(sidebarWidth).toBeLessThan(400);

  await page.locator('button:has-text("Graduated On-Ramp")').last().click();
  await expect(page).toHaveURL(/\?doc=onramp$/);
  await expect(page.locator("h1", { hasText: "Graduated On-Ramp" }).last()).toBeVisible();

  // Links between mirrored docs stay inside the explorer.
  await page.locator('.spec-prose a[href="/spec-explorer?doc=macro-dsl"]').last().click();
  await expect(page).toHaveURL(/\?doc=macro-dsl$/);

  await page.goBack();
  await expect(page).toHaveURL(/\?doc=onramp$/);
});

test("spec explorer: full-text search jumps to the matching section", async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 900 });
  await page.goto("/spec-explorer");
  const input = page.getByLabel("Search spec documents").last();
  const results = page.getByRole("region", { name: "Matches in the text of the docs" }).last();

  // No doc title mentions this; it's a heading inside the integration guide.
  await input.fill("obligation leak escalation");
  await expect(results.getByRole("button").first()).toContainText("Obligation leak escalation policy");
  await results.getByRole("button").first().click();
  await expect(page).toHaveURL(/\?doc=integration#obligation-leak-escalation-policy$/);
  await expect(page.locator('[id="obligation-leak-escalation-policy"]').last()).toBeInViewport();

  // A hit in the doc that's already open still scrolls to its heading.
  await input.fill("wasm32 guardrails");
  await results.getByRole("button", { name: /wasm32 Guardrails/ }).first().click();
  await expect(page).toHaveURL(/\?doc=integration#wasm32-guardrails$/);
  await expect(page.locator('[id="wasm32-guardrails"]').last()).toBeInViewport();
});

test("spec explorer: an open doc doesn't re-render in a loop", async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 900 });
  await page.goto("/spec-explorer?doc=onramp");
  await expect(page.locator(".spec-prose").last()).toBeVisible();
  // A context update used to freeze the tab while a doc was open.
  await page.getByRole("button", { name: "Toggle Lab Mode" }).click();
  await expectResponsive(page);
  await page.keyboard.press("Control+k");
  await expect(page.getByRole("dialog", { name: "Search the site" })).toBeVisible();
  await expectResponsive(page);
  // Escape closes the palette without also closing the doc.
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page).toHaveURL(/\?doc=onramp$/);
});

test("command palette: search reaches demos, docs, and glossary terms", async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 900 });
  await page.goto("/");
  const dialog = page.getByRole("dialog", { name: "Search the site" });

  await page.keyboard.press("Control+k");
  await page.keyboard.type("cancel potential");
  await expect(dialog.getByRole("option").first()).toContainText("Cancel potential");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/showcase#cancel-potential$/);

  await page.getByRole("button", { name: "Search the site" }).click();
  await page.keyboard.type("fiber");
  await expect(dialog.getByRole("option").first()).toContainText("Fiber");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/glossary\?term=Fiber$/);
  await expect(page.locator('button[aria-expanded="true"]', { hasText: "Fiber" })).toBeVisible();

  await page.keyboard.press("Control+k");
  await page.keyboard.type("graduated on-ramp");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/spec-explorer\?doc=onramp$/);

  // Anything longer than two characters can go on to the docs' full text.
  await page.keyboard.press("Control+k");
  await page.keyboard.type("escalation policy");
  await dialog.getByRole("option", { name: /Search the text of all/ }).click();
  await expect(page).toHaveURL(/\/spec-explorer\?q=escalation%20policy$/);
  await expect(page.getByLabel("Search spec documents").last()).toHaveValue("escalation policy");
  await expect(
    page.getByRole("region", { name: "Matches in the text of the docs" }).last().getByRole("button").first()
  ).toContainText("Obligation leak escalation policy");

  await page.keyboard.press("Control+k");
  await page.keyboard.type("zq");
  await expect(dialog).toContainText("Nothing matches");
});

test("showcase: every demo has a section with upstream source links", async ({ page }) => {
  await page.goto("/showcase");
  const sections = page.locator("main section[id]");
  const ids = await sections.evaluateAll((els) => els.map((el) => el.id));
  expect(ids.length).toBeGreaterThanOrEqual(25);
  for (const id of ids) {
    const links = page.locator(`section[id="${id}"] a[href^="https://github.com/Dicklesworthstone/asupersync/"]`);
    expect(await links.count(), `source links in #${id}`).toBeGreaterThan(0);
  }
});

test("showcase: renamed anchors still land on their demo", async ({ page }) => {
  await page.goto("/showcase#exp3-scheduler");
  await expect(page).toHaveURL(/#adaptive-scheduler$/);
  await expect(page.locator("#adaptive-scheduler")).toBeInViewport();
});
