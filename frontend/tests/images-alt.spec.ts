// tests/e2e/images-alt.spec.ts
import { test, expect } from "@playwright/test";

const LOCALE = process.env.TEST_LOCALE || "tr";

test.describe("Görseller ALT", () => {
  test(`/${LOCALE} → ilk 12 img için alt niteliği boş olmamalı (decorative değilse)`, async ({ page }) => {
    await page.goto(`/${LOCALE}`);

    // next/image çıktıları da <img> olarak render edilir
    const imgs = await page.locator("img").all();
    expect(imgs.length).toBeGreaterThan(0);

    const sample = imgs.slice(0, Math.min(imgs.length, 12));
    for (const img of sample) {
      const role = await img.getAttribute("role"); // decorative? (genelde yok)
      const ariaHidden = await img.getAttribute("aria-hidden");
      if (role === "presentation" || ariaHidden === "true") continue;

      const alt = await img.getAttribute("alt");
      expect(alt && alt.trim().length > 0).toBeTruthy();
    }
  });
});
