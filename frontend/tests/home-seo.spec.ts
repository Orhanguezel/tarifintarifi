import { test, expect } from "@playwright/test";

const LOCALE = process.env.TEST_LOCALE || "tr";
const LOCALES = (process.env.TEST_LOCALES_CSV || "tr,en,de")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);
const CANONICAL_HOST = (process.env.CANONICAL_HOST || "ensotek.de").replace(/^www\./, "");

test.describe("Home SEO", () => {
  test(`/${LOCALE} meta & link etiketleri`, async ({ page }) => {
    await page.goto(`/${LOCALE}`, { waitUntil: "domcontentloaded" });

    // <html lang=...>
    await expect(page.locator("html")).toHaveAttribute("lang", LOCALE);

    // h1 (DOM'da olmalı)
    await expect(page.locator("h1#page-title")).toHaveCount(1);

    // title (boş değil)
    // bazen ilk mikro-tick'te boş gelebilir; kısa bir poll ile garantile
    await expect
      .poll(async () => (await page.title()).trim(), { timeout: 3000 })
      .not.toEqual("");

    const title = await page.title();
    expect(title).toBeTruthy();

    // meta description (en az 40 karakter)
    const desc = await page.locator('meta[name="description"]').getAttribute("content");
    expect(desc && desc.length >= 40).toBeTruthy();

    // canonical → https + canonical host + /{locale}
    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect(canonical).toBeTruthy();
    expect(String(canonical)).toMatch(
      new RegExp(`^https://(?:${CANONICAL_HOST.replace(/\./g, "\\.")})/`)
    );
    expect(String(canonical)).toContain(`/${LOCALE}`);

    // hreflang → TEST_LOCALES_CSV içindeki tüm diller için link olmalı
    for (const l of LOCALES) {
      const href = await page.locator(`link[rel="alternate"][hrefLang="${l}"]`).getAttribute("href");
      expect(href).toBeTruthy();
      expect(String(href)).toMatch(
        new RegExp(`^https://(?:${CANONICAL_HOST.replace(/\./g, "\\.")})/`)
      );
    }
    // x-default da olmalı
    await expect(page.locator('link[rel="alternate"][hrefLang="x-default"]')).toHaveCount(1);

    // Open Graph
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute("content");
    const ogDesc  = await page.locator('meta[property="og:description"]').getAttribute("content");
    const ogUrl   = await page.locator('meta[property="og:url"]').getAttribute("content");
    const ogImg   = await page.locator('meta[property="og:image"]').first().getAttribute("content");

    expect(ogTitle && ogTitle.length > 0).toBeTruthy();
    expect(ogDesc && ogDesc.length >= 40).toBeTruthy();
    expect(ogUrl).toBeTruthy();
    expect(String(ogUrl)).toBe(String(canonical));                // og:url = canonical
    expect(ogImg && /^https:\/\//.test(ogImg)).toBeTruthy();      // absolute https
    expect(String(ogImg)).toMatch(/\.webp(\?|$)/);                 // mümkünse webp

    // Twitter
    const twCard  = await page.locator('meta[name="twitter:card"]').getAttribute("content");
    const twTitle = await page.locator('meta[name="twitter:title"]').getAttribute("content");
    const twDesc  = await page.locator('meta[name="twitter:description"]').getAttribute("content");
    const twImg   = await page.locator('meta[name="twitter:image"]').getAttribute("content");

    expect(twCard).toBe("summary_large_image");
    expect(twTitle && twTitle.length > 0).toBeTruthy();
    expect(twDesc && twDesc.length >= 40).toBeTruthy();
    expect(twImg && /^https:\/\//.test(twImg)).toBeTruthy();
  });
});
