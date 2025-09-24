// tests/e2e/social-links.spec.ts
import { test, expect } from "@playwright/test";

const LOCALE = process.env.TEST_LOCALE || "tr";

// Şirket sosyal linkleri (BE'dekiyle uyumlu)
const SOCIAL_EXPECTED = [
  "facebook.com/Ensotek",
  "instagram.com/ensotek_tr",
  "x.com/Ensotek_Cooling",
  "linkedin.com/company/ensotek-su-so-utma-kuleleri-ltd-ti-",
  "youtube.com/channel/UCX22ErWzyT4wDqDRGN9zYmg",
];

test.describe("Sosyal bağlantılar", () => {
  test(`/${LOCALE} → footer/menü içinde beklenen sosyal linkler absolute olmalı`, async ({ page }) => {
    await page.goto(`/${LOCALE}`);

    const hrefs = await page.$$eval('a[href^="http"]', as => as.map(a => (a as HTMLAnchorElement).href));
    for (const frag of SOCIAL_EXPECTED) {
      const hit = hrefs.find(h => h.includes(frag));
      expect(hit, `Eksik link: ${frag}`).toBeTruthy();
      expect(hit!).toMatch(/^https?:\/\//);
    }
  });
});
