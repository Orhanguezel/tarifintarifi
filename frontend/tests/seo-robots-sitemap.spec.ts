import { test, expect, request } from '@playwright/test';

const LOCALE = process.env.TEST_LOCALE || 'tr';

test('robots.txt erişilebilir', async ({ baseURL }) => {
  const api = await request.newContext();
  const res = await api.get(`${baseURL}/robots.txt`);
  expect(res.ok()).toBeTruthy();
  const body = await res.text();
  expect(body).toMatch(/Sitemap:/i);
  expect(body).toMatch(/User-agent:\s*\*/i);
});

test('sitemap.xml temel alanlar', async ({ baseURL }) => {
  const api = await request.newContext();
  const res = await api.get(`${baseURL}/sitemap.xml`);
  expect(res.ok()).toBeTruthy();
  const xml = await res.text();
  expect(xml).toMatch(/<urlset/i);
  expect(xml).toMatch(new RegExp(`<loc>.*\\/${LOCALE}<\\/loc>`, 'i'));
});

test('root → locale redirect', async ({ baseURL }) => {
  const api = await request.newContext();
  const res = await api.get(`${baseURL}/`, { maxRedirects: 0 });
  expect([301, 302, 307, 308]).toContain(res.status());
  const loc = res.headers()['location'] || res.headers()['Location'];
  expect(loc).toBeTruthy();
  // /tr veya seçili cookie diline yönlenmeli
});
