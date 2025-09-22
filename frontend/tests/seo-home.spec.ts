import { test, expect } from "@playwright/test";

// Varsayılan dil: tr
const LOCALE = process.env.TEST_LOCALE || "tr";

test.describe("Home SEO", () => {
  test(`/${LOCALE} meta & link etiketleri`, async ({ page }) => {
    await page.goto(`/${LOCALE}`);

    // <html lang= ... >
    await expect(page.locator("html")).toHaveAttribute("lang", LOCALE);

    // h1 (görünmez olsa bile DOM'da olmalı)
    await expect(page.locator("h1#page-title")).toHaveCount(1);

    // title
    const title = await page.title();
    expect(title).toBeTruthy();

    // description — birden fazla olabilir, ilkini al
    const descCount = await page.locator('meta[name="description"]').count();
    expect(descCount).toBeGreaterThan(0);
    const desc = await page.locator('meta[name="description"]').first().getAttribute("content");
    expect(desc && desc.length > 0).toBeTruthy();

    // canonical — birden fazla olabilir, ilkini al
    const canonical = await page.locator('link[rel="canonical"]').first().getAttribute("href");
    expect(canonical && canonical.includes(`/${LOCALE}`)).toBeTruthy();

    // hreflang’ler
    const alternates = await page.locator('link[rel="alternate"][hreflang]').all();
    expect(alternates.length).toBeGreaterThanOrEqual(5);

    // OG/Twitter (ilk meta'yı al)
    const ogTitle = await page.locator('meta[property="og:title"]').first().getAttribute("content");
    const ogDesc  = await page.locator('meta[property="og:description"]').first().getAttribute("content");
    const ogUrl   = await page.locator('meta[property="og:url"]').first().getAttribute("content");
    const ogImg   = await page.locator('meta[property="og:image"]').first().getAttribute("content");

    expect(ogTitle).toBeTruthy();
    expect(ogDesc).toBeTruthy();
    expect(ogUrl && ogUrl.includes(`/${LOCALE}`)).toBeTruthy();
    expect(ogImg).toBeTruthy();

    const twCard = await page.locator('meta[name="twitter:card"]').first().getAttribute("content");
    expect(twCard).toBe("summary_large_image");
  });
});
