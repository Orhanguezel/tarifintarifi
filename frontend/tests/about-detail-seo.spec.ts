import { test, expect } from "@playwright/test";

const LOCALES = (process.env.TEST_LOCALES || "tr,en,de,fr,es,pl").split(",");

for (const LOCALE of LOCALES) {
  test.describe(`About Detail SEO — /${LOCALE}/about?slug=...`, () => {
    test(`/${LOCALE}/about?slug=… → title/description/OG/canonical`, async ({ page }) => {
      // 1) Listeye git
      await page.goto(`/${LOCALE}/about`);

      // 2) İlk öğenin linkinden slug’ı çek
      const firstHref = await page.locator('nav[aria-label*="Hakkımızda"], nav >> a[href*="about?slug="]').first().getAttribute("href");
      expect(firstHref, "About listede en az bir öğe bekleniyordu").toBeTruthy();

      // Slug paramını ayıkla
      const u = new URL(firstHref!, await page.evaluate(() => window.location.origin));
      const slug = u.searchParams.get("slug");
      expect(slug, "Slug parametresi bulunamadı").toBeTruthy();

      // 3) Detay görünüm (bizim UI query param ile aynı sayfada render ediyor)
      await page.goto(`/${LOCALE}/about?slug=${encodeURIComponent(slug!)}`);

      // Title boş değil (detay başlığı, SeoFromStore 'about-detail' ile set’leniyor)
      const titleText = await page.title();
      expect(titleText.trim().length).toBeGreaterThan(2);

      // Description
      const desc = await page.locator('head meta[name="description"]').getAttribute("content");
      expect((desc || "").trim().length).toBeGreaterThan(10);

      // OG image (varsa en az bir tane)
      const ogImgCount = await page.locator('head meta[property="og:image"]').count();
      expect(ogImgCount).toBeGreaterThan(0);

      // Canonical (query dahil)
      const canonical = await page.locator('head link[rel="canonical"]').getAttribute("href");
      const origin = await page.evaluate(() => window.location.origin);
      expect(String(canonical)).toBe(`${origin}/${LOCALE}/about?slug=${encodeURIComponent(slug!)}`);
    });
  });
}
