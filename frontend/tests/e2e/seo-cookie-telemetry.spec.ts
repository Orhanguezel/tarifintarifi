import { test, expect } from "@playwright/test";

const LOCALE = process.env.TEST_LOCALE || "tr";

// FE tarafında cookie key formatı:
// seo_snap_${tenant}_${pageKey}_${locale}
// tenant: ensotek (tek tenant), pageKey: "home"
const COOKIE_KEY = `seo_snap_ensotek_home_${LOCALE}`;

test.describe("SEO Telemetry Cookie Snapshot", () => {
  test(`/${LOCALE} → seo snapshot cookie yazılır`, async ({ page }) => {
    await page.goto(`/${LOCALE}`);

    // cookie oluşumu biraz gecikebilir, kısa bir bekleme iyi olur
    await page.waitForTimeout(200);

    const cookies = await page.context().cookies();
    const snap = cookies.find(c => c.name === COOKIE_KEY);
    expect(snap).toBeTruthy();

    // İçerik kontrolü (title/og alanları olabilir)
    const docCookie = await page.evaluate(() => document.cookie);
    expect(docCookie.includes(`${COOKIE_KEY}=`)).toBeTruthy();
  });
});
