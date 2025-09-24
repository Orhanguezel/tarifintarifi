import { test, expect } from "@playwright/test";

const LOCALES = (process.env.TEST_LOCALES_CSV || "tr,en,de")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);
const LOCALE = process.env.TEST_LOCALE || "tr";
const CANONICAL_HOST = (process.env.CANONICAL_HOST || "ensotek.de").replace(/^www\./, "");

test.describe("Head tags — OG / Twitter / hreflang", () => {
  test(`/${LOCALE} → OG & Twitter meta ve hreflang`, async ({ page }) => {
    await page.goto(`/${LOCALE}`);

    // canonical
    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect(canonical).toBeTruthy();
    expect(String(canonical)).toMatch(new RegExp(`^https://(?:${CANONICAL_HOST.replace(/\./g, "\\.")})/`));

    // og:url canonical ile aynı olmalı
    const ogUrl = await page.locator('meta[property="og:url"]').getAttribute("content");
    expect(ogUrl).toBeTruthy();
    expect(ogUrl).toBe(canonical);

    // OG Title/Desc
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute("content");
    const ogDesc  = await page.locator('meta[property="og:description"]').getAttribute("content");
    expect(ogTitle).toBeTruthy();
    expect(ogDesc && ogDesc.length > 40).toBeTruthy();

    // OG Image — absolute https ve .webp olması beklenir (company 2. görseli)
    const ogImg = await page.locator('meta[property="og:image"]').first().getAttribute("content");
    expect(ogImg).toBeTruthy();
    expect(String(ogImg)).toMatch(/^https:\/\//);
    expect(String(ogImg)).toMatch(/\.webp(\?|$)/);

    // Twitter
    const twCard = await page.locator('meta[name="twitter:card"]').getAttribute("content");
    const twTitle = await page.locator('meta[name="twitter:title"]').getAttribute("content");
    const twDesc  = await page.locator('meta[name="twitter:description"]').getAttribute("content");
    const twImg   = await page.locator('meta[name="twitter:image"]').getAttribute("content");
    expect(twCard).toBeTruthy();
    expect(twTitle).toBeTruthy();
    expect(twDesc && twDesc.length > 40).toBeTruthy();
    expect(twImg && /^https:\/\//.test(twImg)).toBeTruthy();

    // hreflang’ler
    for (const l of LOCALES) {
      await expect(page.locator(`link[rel="alternate"][hrefLang="${l}"]`)).toHaveCount(1);
    }
    await expect(page.locator('link[rel="alternate"][hrefLang="x-default"]')).toHaveCount(1);
  });
});
