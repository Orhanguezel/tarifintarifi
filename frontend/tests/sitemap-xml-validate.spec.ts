import { test, expect, APIResponse } from "@playwright/test";

const CANONICAL_HOST = (process.env.CANONICAL_HOST || "ensotek.de").replace(/^www\./, "");
const LOCALES = (process.env.TEST_LOCALES_CSV || "tr,en,de")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

function header(res: APIResponse, name: string) {
  const h = res.headers();
  const k = Object.keys(h).find(k => k.toLowerCase() === name.toLowerCase());
  return k ? h[k] : undefined;
}

async function expectXmlOk(res: APIResponse) {
  expect(res.ok(), `HTTP ${res.status()} for ${res.url()}`).toBeTruthy();
  const ctype = header(res, "content-type") || "";
  expect(/xml/i.test(ctype), `content-type is "${ctype}"`).toBeTruthy();
}

function extractLocs(xml: string): string[] {
  return [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map(m => m[1]);
}

function expectUrlOnCanonicalHost(u: string) {
  expect(u).toMatch(/^https:\/\//);
  expect(u).toMatch(new RegExp(`^https://(?:${CANONICAL_HOST.replace(/\./g, "\\.")})/`));
}

test.describe("Sitemap XML yapısı", () => {
  test("sitemap-index.xml → alt sitemap’ler ve URL’ler (absolute https + canonical host)", async ({ request, baseURL }) => {
    // 1) Index endpoint (BE proxy edilen)
    const idx = await request.get(`${baseURL}/api/seo/sitemap-index.xml`);
    await expectXmlOk(idx);
    const idxXml = await idx.text();

    // index mi tekli mi?
    const isIndex = /<sitemapindex[\s>]/i.test(idxXml);

    if (isIndex) {
      const sitemapLocs = extractLocs(idxXml);
      expect(sitemapLocs.length).toBeGreaterThan(0);

      // İlk 3 alt-sitemap’ı örnekle (aşırı büyük sitelerde testi hızlandırır)
      const sample = sitemapLocs.slice(0, 3);
      for (const loc of sample) {
        expectUrlOnCanonicalHost(loc);
        const subRes = await request.get(loc);
        await expectXmlOk(subRes);
        const subXml = await subRes.text();

        // Alt dosya urlset olmalı ve içinde URL bulunmalı
        expect(/<urlset[\s>]/i.test(subXml)).toBeTruthy();
        const urls = extractLocs(subXml);
        expect(urls.length).toBeGreaterThan(0);

        // Her <loc> absolute https + canonical host
        const seen = new Set<string>();
        for (const u of urls) {
          expectUrlOnCanonicalHost(u);
          expect(seen.has(u)).toBeFalsy(); // duplicate olmasın
          seen.add(u);
        }
      }
    } else {
      // Tekli sitemap senaryosu
      expect(/<urlset[\s>]/i.test(idxXml)).toBeTruthy();
      const urls = extractLocs(idxXml);
      expect(urls.length).toBeGreaterThan(0);
      const seen = new Set<string>();
      for (const u of urls) {
        expectUrlOnCanonicalHost(u);
        expect(seen.has(u)).toBeFalsy();
        seen.add(u);
      }
    }
  });

  test("sitemap.xml (Next metadata) → canonical host & hreflanglı URL’ler de kapsanabilir", async ({ request, baseURL }) => {
    // 2) Next metadata route
    const res = await request.get(`${baseURL}/sitemap.xml`);
    await expectXmlOk(res);
    const xml = await res.text();

    // Hem index hem tekli olabilir:
    if (/<sitemapindex[\s>]/i.test(xml)) {
      const locs = extractLocs(xml);
      expect(locs.length).toBeGreaterThan(0);
      // sadece canonical host doğrula
      for (const s of locs.slice(0, 3)) {
        expectUrlOnCanonicalHost(s);
      }
    } else {
      expect(/<urlset[\s>]/i.test(xml)).toBeTruthy();
      const urls = extractLocs(xml);
      expect(urls.length).toBeGreaterThan(0);
      // canonical host ve https
      for (const u of urls.slice(0, 50)) expectUrlOnCanonicalHost(u);

      // (Opsiyonel) en az bir URL'in desteklenen dillerden birini içermesi beklenebilir
      const hasAnyLocale = urls.some(u => LOCALES.some(l => new RegExp(`/${l}(?:/|$)`).test(u)));
      expect(hasAnyLocale).toBeTruthy();
    }
  });
});
