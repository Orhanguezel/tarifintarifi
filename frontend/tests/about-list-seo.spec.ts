import { test, expect } from "@playwright/test";

const LOCALES = (process.env.TEST_LOCALES || "tr,en,de,fr,es,pl").split(",");

for (const LOCALE of LOCALES) {
  test.describe(`About List SEO — /${LOCALE}/about`, () => {
    test(`/${LOCALE}/about → title/description/canonical/hreflang/JSON-LD`, async ({ page }) => {
      await page.goto(`/${LOCALE}/about`);

      // H1 (sayfa başlığı)
      const h1 = page.locator("h1#page-title");
      await expect(h1).toHaveCount(1);
      const h1Text = (await h1.textContent())?.trim() || "";
      expect(h1Text.length).toBeGreaterThan(2);

      // <title> h1’i içermeli
      const escaped = h1Text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      await expect(page).toHaveTitle(new RegExp(escaped));

      // description
      const desc = await page.locator('head meta[name="description"]').getAttribute("content");
      expect((desc || "").trim().length).toBeGreaterThan(10);

      // canonical
      const canonical = await page.locator('head link[rel="canonical"]').getAttribute("href");
      expect(String(canonical)).toMatch(/^https?:\/\//);
      expect(String(canonical)).toContain(`/${LOCALE}/about`);

      // hreflang
      const langs = ["tr","en","de","fr","es","pl"];
      for (const l of langs) {
        await expect(page.locator(`link[rel="alternate"][hrefLang="${l}"]`)).toHaveCount(1);
      }
      await expect(page.locator('link[rel="alternate"][hrefLang="x-default"]')).toHaveCount(1);

      // JSON-LD
      const origin = await page.evaluate(() => window.location.origin);
      const nodes = await page.$$eval('script[type="application/ld+json"]', els =>
        els.map(e => { try { return JSON.parse(e.textContent || "{}"); } catch { return {}; } })
      );
      expect(nodes.length).toBeGreaterThan(0);

      const breadcrumb = nodes.find(n => n?.["@type"] === "BreadcrumbList");
      const collection = nodes.find(n => n?.["@type"] === "CollectionPage");
      expect(breadcrumb).toBeTruthy();
      expect(collection).toBeTruthy();

      const items = (breadcrumb as any)?.itemListElement || [];
      expect(Array.isArray(items)).toBeTruthy();
      expect(items.length).toBeGreaterThan(0);
      const last = items[items.length - 1];
      expect(String(last?.name || "").length).toBeGreaterThan(2);

      expect(String((collection as any)!.url || "")).toBe(`${origin}/${LOCALE}/about`);
      expect(String((collection as any)!.inLanguage || "")).toBe(LOCALE);
      expect(String((collection as any)!.name || "").length).toBeGreaterThan(2);
    });
  });
}
