import { test, expect } from '@playwright/test';

const PATH = process.env.TEST_CONTENT_PATH; // örn: /tr/hizmet/isbasi-egitimi

test.describe('Content SEO', () => {
  test.skip(!PATH, 'TEST_CONTENT_PATH env yok.');

  test('Meta + JSON-LD (Breadcrumb/Article/FAQ varsa yakalanır)', async ({ page }) => {
    await page.goto(PATH!);

    const title = await page.title();
    expect(title).toBeTruthy();

    const desc = await page.locator('meta[name="description"]').getAttribute('content');
    expect(desc && desc.length > 20).toBeTruthy();

    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical && canonical.includes(PATH!)).toBeTruthy();

    const ogImg = await page.locator('meta[property="og:image"]').first().getAttribute('content');
    expect(ogImg).toBeTruthy();

    const scripts = await page.locator('script[type="application/ld+json"]').all();
    expect(scripts.length).toBeGreaterThanOrEqual(1);

    let hasBreadcrumb = false;
    let hasArticle = false;
    let hasFAQ = false;

    for (const s of scripts) {
      const txt = await s.textContent();
      if (!txt) continue;
      try {
        const json = JSON.parse(txt);
        const list = Array.isArray(json) ? json : [json];
        for (const j of list) {
          if (j['@type'] === 'BreadcrumbList') hasBreadcrumb = true;
          if (j['@type'] === 'Article' || j['@type'] === 'BlogPosting') hasArticle = true;
          if (j['@type'] === 'FAQPage') hasFAQ = true;
        }
      } catch {}
    }
    expect(hasBreadcrumb || hasArticle || hasFAQ).toBeTruthy();
  });
});
