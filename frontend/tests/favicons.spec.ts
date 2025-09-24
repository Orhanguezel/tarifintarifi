// tests/e2e/favicons.spec.ts
import { test, expect } from "@playwright/test";

const ICON_PATHS = [
  "/favicon.ico",
  "/favicon-16x16.png",
  "/favicon-32x32.png",
  "/apple-touch-icon.png",
];

test.describe("Favicons", () => {
  test("kökteki favicon dosyaları 200 dönmeli ve 'image/*' content-type olmalı", async ({ request, baseURL }) => {
    for (const p of ICON_PATHS) {
      const res = await request.get(`${baseURL}${p}`);
      expect(res.ok()).toBeTruthy();
      const ctype = res.headers()["content-type"] || "";
      expect(/image\//i.test(ctype)).toBeTruthy();
    }
  });
});
