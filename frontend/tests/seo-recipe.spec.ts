import { test, expect } from '@playwright/test';

const PATH = process.env.RECIPE_TEST_PATH; // örn: /tr/recipes/mercimek-corbasi

test.describe('Recipe SEO', () => {
  test.skip(!PATH, 'RECIPE_TEST_PATH env yok.');

  test('Meta + JSON-LD (Recipe & BreadcrumbList)', async ({ page }) => {
    await page.goto(PATH!);

    // title, description
    const title = await page.title();
    expect(title).toBeTruthy();
    const desc = await page.locator('meta[name="description"]').getAttribute('content');
    expect(desc && desc.length > 0).toBeTruthy();

    // canonical
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical && canonical.includes(PATH!)).toBeTruthy();

    // OG image (fallback dahil)
    const ogImg = await page.locator('meta[property="og:image"]').first().getAttribute('content');
    expect(ogImg).toBeTruthy();

    // JSON-LD script’leri
    const scripts = await page.locator('script[type="application/ld+json"]').all();
    expect(scripts.length).toBeGreaterThanOrEqual(1);

    let hasRecipe = false;
    let hasBreadcrumb = false;
    for (const s of scripts) {
      const txt = await s.textContent();
      if (!txt) continue;
      try {
        const json = JSON.parse(txt);
        const list = Array.isArray(json) ? json : [json];
        for (const j of list) {
          if (j['@type'] === 'Recipe') hasRecipe = true;
          if (j['@type'] === 'BreadcrumbList') hasBreadcrumb = true;
        }
      } catch {}
    }
    expect(hasRecipe).toBeTruthy();
    expect(hasBreadcrumb).toBeTruthy();
  });
});
