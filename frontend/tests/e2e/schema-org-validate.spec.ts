// tests/e2e/schema-org-validate.spec.ts
import { test, expect } from "@playwright/test";

const LOCALE = process.env.TEST_LOCALE || "fr";

test.describe("Schema.org JSON-LD", () => {
  test(`/${LOCALE} → Organization & WebSite yapılandırılmış veriler doğru alanlara sahip (geniş)`, async ({ page }) => {
    await page.goto(`/${LOCALE}`, { waitUntil: "domcontentloaded" });

    // JSON-LD script sayısını bekle (max 5sn)
    await page.waitForFunction(() => {
      const nodes = document.querySelectorAll('script[type="application/ld+json"]');
      return nodes.length > 0;
    }, { timeout: 5000 });

    const origin = await page.evaluate(() => window.location.origin);

    const nodes = await page.$$eval('script[type="application/ld+json"]', els =>
      els.map(e => {
        try { return JSON.parse(e.textContent || "{}"); } catch { return {}; }
      })
    );

    // Eğer beklenmedik şekilde 0 olursa debug edin
    if (!nodes.length) {
      const html = await page.content();
      console.error("DEBUG_HTML_START\n", html.slice(0, 2000), "\nDEBUG_HTML_END");
    }
    expect(nodes.length).toBeGreaterThan(0);

    const org = nodes.find(n => n && n["@type"] === "Organization");
    const site = nodes.find(n => n && n["@type"] === "WebSite");

    expect(org, "Organization JSON-LD bulunamadı").toBeTruthy();
    expect(site, "WebSite JSON-LD bulunamadı").toBeTruthy();

    // ── Organization ──
    expect(String(org!.name || "")?.trim().length, "org.name boş olmamalı").toBeGreaterThan(0);
    expect(String(org!.url || "")).toMatch(/^https?:\/\//);
    expect(String(org!.url || "")).toContain(origin);

    // Şirketten geldiği için açıklama dolu beklenir
    expect(String(org!.description || "")?.trim().length, "org.description boş olmamalı").toBeGreaterThan(10);

    if (org!.logo) {
      expect(String(org!.logo)).toMatch(/^https?:\/\//);
    }
    if (Array.isArray(org!.sameAs)) {
      for (const u of org!.sameAs) {
        expect(String(u)).toMatch(/^https?:\/\//);
      }
    }

    // ── WebSite ──
    expect(String(site!.url || "")).toMatch(/^https?:\/\//);
    if (site!.potentialAction?.target) {
      expect(String(site!.potentialAction.target)).toContain("{search_term_string}");
    }
    if (site!.potentialAction?.["query-input"]) {
      expect(String(site!.potentialAction["query-input"])).toBe("required name=search_term_string");
    }
  });
});
