// tests/e2e/sitemap-proxy-route.spec.ts
import { test, expect } from "@playwright/test";

const CANONICAL_HOST = (process.env.CANONICAL_HOST || "ensotek.de").replace(/^www\./, "");

test.describe("Sitemap (metadata route)", () => {
  test("GET /sitemap.xml → urlset ve canonical host", async ({ request, baseURL }) => {
    const res = await request.get(`${baseURL}/sitemap.xml`);
    expect(res.ok()).toBeTruthy();

    const ctype = res.headers()["content-type"] || "";
    expect(/xml/i.test(ctype)).toBeTruthy();

    const xml = await res.text();
    expect(/<(urlset|sitemapindex)\b/i.test(xml)).toBeTruthy();

    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/gi)].map(m => m[1]);
    expect(locs.length).toBeGreaterThan(0);

    for (const u of locs.slice(0, 25)) { // örneklem
      expect(u).toMatch(/^https:\/\//);
      expect(u).toMatch(new RegExp(`^https://(?:${CANONICAL_HOST.replace(/\./g, "\\.")})/`));
    }
  });
});
