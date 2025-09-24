import { test, expect, request } from '@playwright/test';

// ENV ile yöneteceğimiz değerler
const LOCALE = (process.env.TEST_LOCALE || 'tr').toLowerCase();
const CANONICAL_HOST = process.env.CANONICAL_HOST || 'ensotek.de';
const EXPECT_NOINDEX = (process.env.EXPECT_NOINDEX || 'false').toLowerCase() === 'true';

test.describe('Robots & Sitemaps', () => {
  test('robots.txt erişilebilir ve beklenen alanları içerir', async ({ baseURL }) => {
    const api = await request.newContext();
    const res = await api.get(`${baseURL}/robots.txt`);
    expect(res.ok()).toBeTruthy();

    if (EXPECT_NOINDEX) {
      // middleware noindex → header
      expect((res.headers()['x-robots-tag'] || '').toLowerCase()).toContain('noindex');
    }

    const body = await res.text();
    expect(body).toMatch(/User-?agent:\s*\*/i);
    // BE taraflı index: FE robots.ts -> /api/seo/sitemap-index.xml
    expect(body).toMatch(/Sitemap:\s*https?:\/\/[^/\s]+\/api\/seo\/sitemap-(index|1)\.xml/i);
  });

  test('sitemap index veya tekli sitemap erişilebilir', async ({ baseURL }) => {
    const api = await request.newContext();

    // Önce index’i deneyelim
    let res = await api.get(`${baseURL}/api/seo/sitemap-index.xml`);
    if (!res.ok()) {
      // single dosya olabilir
      res = await api.get(`${baseURL}/api/seo/sitemap.xml`);
    }
    expect(res.ok()).toBeTruthy();

    const xml = await res.text();
    // index veya tekli sitemap’ten biri geçerli olmalı
    expect(xml).toMatch(/<(sitemapindex|urlset)\b/i);
  });

  test('root → locale redirect çalışıyor', async ({ baseURL }) => {
    const api = await request.newContext();
    const res = await api.get(`${baseURL}/`, { maxRedirects: 0 });
    expect([301, 302, 307, 308]).toContain(res.status());
    const loc = res.headers()['location'] || res.headers()['Location'];
    expect(loc).toBeTruthy();
    // /{locale} ile başlamalı (cookie dili farklı ise farklı locale olabilir)
    expect(String(loc)).toMatch(/^\/[a-z]{2}(\/|$)/);
  });

  test('favicon kökten erişilir ve locale\'e takılmaz', async ({ baseURL }) => {
    const api = await request.newContext();
    const res = await api.get(`${baseURL}/favicon.ico`, { maxRedirects: 0 });
    // hiç redirect olmamalı
    expect(res.status()).toBe(200);
    expect(res.url()).toMatch(/\/favicon\.ico$/);
    const ct = (res.headers()['content-type'] || '').toLowerCase();
    expect(ct).toMatch(/image/);
  });
});

test.describe('Canonical host / HSTS', () => {
  test(`/${LOCALE} sayfasında canonical ensotek apex host olmalı`, async ({ page }) => {
    await page.goto(`/${LOCALE}`);
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical).toBeTruthy();
    expect(String(canonical)).toMatch(new RegExp(`^https://(?:${CANONICAL_HOST.replace('.', '\\.')})/`));
    expect(String(canonical)).not.toContain('www.');
  });
});
