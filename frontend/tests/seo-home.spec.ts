import { test, expect } from '@playwright/test';

// Varsayılan dil: tr
const LOCALE = process.env.TEST_LOCALE || 'tr';

test.describe('Home SEO', () => {
  test(`/${LOCALE} meta & link etiketleri`, async ({ page }) => {
    await page.goto(`/${LOCALE}`);

    // <html lang= ... >
    await expect(page.locator('html')).toHaveAttribute('lang', LOCALE);

    // h1 (görünmez olsa bile DOM'da olmalı)
    await expect(page.locator('h1#page-title')).toHaveCount(1);


    // title & meta description
    const title = await page.title();
    expect(title).toBeTruthy();

    const desc = await page.locator('meta[name="description"]').getAttribute('content');
    expect(desc && desc.length > 0).toBeTruthy();

    // canonical
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical && canonical.includes(`/${LOCALE}`)).toBeTruthy();

    // hreflang’ler (desteklediğin diller kadar olmalı)
    const alternates = await page.locator('link[rel="alternate"][hreflang]').all();
    expect(alternates.length).toBeGreaterThanOrEqual(5); // 10 dil varsa 10+ olabilir

    // OG/Twitter
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
    const ogDesc  = await page.locator('meta[property="og:description"]').getAttribute('content');
    const ogUrl   = await page.locator('meta[property="og:url"]').getAttribute('content');
    const ogImg   = await page.locator('meta[property="og:image"]').first().getAttribute('content');

    expect(ogTitle).toBeTruthy();
    expect(ogDesc).toBeTruthy();
    expect(ogUrl && ogUrl.includes(`/${LOCALE}`)).toBeTruthy();
    expect(ogImg).toBeTruthy(); // fallback görsel sayesinde boş olmamalı

    const twCard = await page.locator('meta[name="twitter:card"]').getAttribute('content');
    expect(twCard).toBe('summary_large_image');
  });
});
