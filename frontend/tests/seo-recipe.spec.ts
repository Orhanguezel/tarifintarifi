import { test, expect } from "@playwright/test";

const PATH = process.env.RECIPE_TEST_PATH; // örn: /de/recipes/turkish-scrambled-eggs

test.describe("Recipe SEO", () => {
  test.skip(!PATH, "RECIPE_TEST_PATH env yok.");

  test("Meta + JSON-LD (Recipe & BreadcrumbList)", async ({ page, request, baseURL }) => {
    // 1) Sayfa gerçekten var mı? (404 ise testi atla)
    const probe = await request.get(`${baseURL}${PATH}`, { maxRedirects: 2 });
    test.skip(!probe.ok(), `PATH 200 dönmedi (${probe.status()}). Geçerli bir recipe yolu verin.`);

    // 2) Sayfaya git
    await page.goto(PATH!);

    // 3) title & description
    const title = await page.title();
    expect(title).toBeTruthy();
    const desc = await page.locator('meta[name="description"]').getAttribute("content");
    expect(desc && desc.length > 0).toBeTruthy();

    // 4) canonical — sadece pathname kıyasla (origin değişken olabilir)
    const canonicalHref = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect(canonicalHref).toBeTruthy();

    // canonical tam URL olabilir (örn. https://prod.site/de/recipes/slug)
    // biz sadece path kısmını kıyaslayalım:
    const canonicalUrl = new URL(canonicalHref!, canonicalHref!.startsWith("http") ? undefined : baseURL);
    // PATH (örn "/de/recipes/slug") ile eşleşmeli
    // (bazı ortamlarda trailing slash olabilir, onu da normalize edelim)
    const expectedPath = PATH!.replace(/\/+$/, "");
    const actualPath   = canonicalUrl.pathname.replace(/\/+$/, "");
    expect(actualPath).toBe(expectedPath);

    // 5) OG image (fallback dahil)
    const ogImg = await page.locator('meta[property="og:image"]').first().getAttribute("content");
    expect(ogImg).toBeTruthy();

    // 6) JSON-LD script’leri
    const scripts = await page.locator('script[type="application/ld+json"]').all();
    expect(scripts.length).toBeGreaterThanOrEqual(1);

    let hasRecipe = false;
    let hasBreadcrumb = false;
    for (const s of scripts) {
      const txt = await s.textContent();
      if (!txt) continue;
      try {
        const json = JSON.parse(txt);
        const list = Array.isArray(json) ? json : [json];
        for (const j of list) {
          if (j["@type"] === "Recipe") hasRecipe = true;
          if (j["@type"] === "BreadcrumbList") hasBreadcrumb = true;
        }
      } catch {
        // JSON parse hatası varsa es geç (diğer script’lere bakıyoruz)
      }
    }

    expect(hasRecipe).toBeTruthy();
    expect(hasBreadcrumb).toBeTruthy();
  });
});
