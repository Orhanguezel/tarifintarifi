# Ensotek Frontend — İlerleme Raporu ve Yol Haritası (v1)

> Tarih: {{today}}  
> Kapsam: SEO altyapısı, çok dillilik, veri katmanı (RTK Query + RSC), içerik sayfaları (About/Products/Sparepart/News/Library/References), sayfa paternleri ve sonraki adımlar.

---

## 1) Özet (Executive Summary)
- **Hedef:** Çok dilli, çok tenant’lı (Accept-Language + X-Tenant) SEO-dostu ve SSR/RSC uyumlu bir Next.js 15 tabanlı frontend.
- **Bugüne kadar yapılanlar:**
  - **Çok dillilik kaynaklarının tek merkezde toplanması:** `src/types/common.ts` güncellendi (diller alfabetik: ar, de, en, es, fr, hi, it, pl, pt, ru, tr, zh), `LANG_LABELS/DATE_FORMATS/LOCALE_MAP` konsolide edildi ve **deterministik** yapıldı.
  - **SEO altyapısı:** `basicMeta` ile **deterministik** title/description üretimi; **hreflang**, **canonical**, **OG/Twitter** meta paternleri korundu.
  - **JSON-LD:** `SiteJsonLd` kompakt/opsiyonel alan temizliği ve `Organization + WebSite` şemalarının min. gereklilikleri.
  - **Veri katmanı mimarisi:** RTK Query (client) + RSC/SSR fetcher’lar (server) paternleştirildi.  
    - Modüller: **About**, **Products**, **Sparepart**, **News**, **Library**, **References** (tipler, client/server API dosyaları).
  - **Sayfa paternleri:** List/Detail sayfalarında **UI i18n = safe t** (eksik anahtarlar sayfayı kırmaz), **içerik i18n = strict** (fallback yok) stratejisi oturtuldu.
  - **Slug stratejisi:** Dil başına slug zorunlu değil; **tek slug** mevcutsa **her dilde tek slug** kullanımı desteklendi. Pretty URL’ler (örn. `/{locale}/about/{slug}`).
  - **ISR/RSC önbellek ayarı:** List/Detail sayfaları için `revalidate = 300` (5 dk) ile taze veri stratejisi; admin tarafında `revalidateTag` ile invalidasyon imkanı planlandı.
  - **E2E/SEO testleri:** Kritik olmayan testler şimdilik geçici olarak second-priority; temel hatalar (favicon/robots/sitemap) ve JSON-LD alanları için notlar düşüldü.

---

## 2) Teknik Mimari
### 2.1. Dil Yönetimi
- **Kaynak:** `src/types/common.ts`  
- **İlke:** Tüm dil listeleri, label’lar ve formatlar **tek dosyadan** geliyor; yeni dil eklemek = **tek yer** değişikliği.
- **Kullanım:** UI metinleri `next-intl` ile; içerik alanları (title/summary/content) **strict** okuma (yalnızca aktif dil), UI ise **safe t** (default param) ile.

### 2.2. Veri Katmanı
- **Client (CSR/ISR etkileşimleri):** RTK Query + `axiosBaseQuery()`; `buildCommonHeaders(locale)` ile `Accept-Language` ve `X-Tenant` geçiriliyor.
- **Server (RSC/SSR):** `getServerApiBaseAbsolute()`, `resolveTenant()`, `normalizeLocale()`; `fetch()` ile **no-store** ve gerektiğinde `revalidate` politikaları.
- **Modül Bazlı Dosya Yapısı (örnek):**
  - `src/lib/<module>/types.ts`  
  - `src/lib/<module>/api.client.ts`  
  - `src/lib/<module>/api.server.ts`

### 2.3. Sayfa Paterni
- **Liste sayfaları:**
  - `generateMetadata()` → deterministik meta.
  - `getSafeT()` → UI çeviri fallback’li.
  - İçerik dilleri `pickStrict()` ile **yalnızca aktif locale**.
- **Detay sayfaları:**
  - `searchParams.slug` → yoksa `/[locale]/<modul>`’e veya pretty URL’e redirect.  
  - Başlık ve açıklama **içerikten** geliyor, yoksa UI t’si **default** ile dolduruyor (boş meta önlenir).

---

## 3) Modül Durumları
### 3.1. About
- **RTK Query:** `src/lib/about/api.client.ts`  
- **RSC/SSR:** `src/lib/about/api.server.ts`  
- **Types:** `src/lib/about/types.ts`
- **Sayfalar:**
  - Liste: `app/[locale]/(public)/about/page.tsx`
  - Detay: `app/[locale]/(public)/about/[slug]/page.tsx`
- **Durum:** ✅ Yayında; tek slug → tüm dillerde gösterim çalışıyor.

### 3.2. Products (Ensotekprod)
- **RTK Query:** `src/lib/products/api.client.ts`  
- **RSC/SSR:** `src/lib/products/api.server.ts`  
- **Types:** `src/lib/products/types.ts`
- **Sayfalar:**
  - Liste: `app/[locale]/(public)/products/page.tsx`
  - Detay: `app/[locale]/(public)/products/[slug]/page.tsx`
- **Durum:** ✅ Patern ile tamamlandı.

### 3.3. Sparepart
- **RTK Query:** `src/lib/sparepart/api.client.ts`  
- **RSC/SSR:** `src/lib/sparepart/api.server.ts`  
- **Types:** `src/lib/sparepart/types.ts`
- **Sayfalar:**
  - Liste: `app/[locale]/(public)/sparepart/page.tsx`
  - Detay: `app/[locale]/(public)/sparepart/[slug]/page.tsx`
- **Durum:** ✅ Patern ile tamamlandı.

### 3.4. News
- **RTK Query:** `src/lib/news/api.client.ts`  
- **RSC/SSR:** `src/lib/news/api.server.ts`  
- **Types:** `src/lib/news/types.ts`
- **Sayfalar:**
  - Liste: `app/[locale]/(public)/news/page.tsx`
  - Detay: `app/[locale]/(public)/news/[slug]/page.tsx`
- **Durum:** ✅ Patern ile tamamlandı.

### 3.5. Library
- **RTK Query:** `src/lib/library/api.client.ts`  
- **RSC/SSR:** `src/lib/library/api.server.ts`  
- **Types:** `src/lib/library/types.ts`
- **Sayfalar:**
  - Liste: `app/[locale]/(public)/library/page.tsx`
  - Detay: `app/[locale]/(public)/library/[slug]/page.tsx`
- **Durum:** ✅ Doküman/görsel dosya alanlarıyla birlikte tamamlandı.

### 3.6. References
- **RTK Query:** `src/lib/references/api.client.ts`  
- **RSC/SSR:** `src/lib/references/api.server.ts`  
- **Types:** `src/lib/references/types.ts`
- **Sayfalar:**
  - Liste: `app/[locale]/(public)/references/page.tsx`
  - Detay: `app/[locale]/(public)/references/[slug]/page.tsx`
- **Durum:** ✅ Logo/grid layout + detay içeriği patern ile tamamlandı.

---

## 4) SEO ve Performans Notları
- **Deterministik Meta:** İçerik boşsa bile `t("desc", { default })` ile meta boş bırakılmıyor.
- **Pretty URL:** `/[locale]/<modul>/<slug>` — eski query pattern’inden redirect.
- **JSON-LD:** Organization/WebSite üretimi mevcut; içerik tiplerine uygun (Article, Product, Breadcrumb, FAQ) JSON-LD **ileride** eklenecek.
- **Performans:**
  - RSC fetch + `revalidate=300` (liste/detay).  
  - Görseller için `next/image`’a geçiş (boyut/sizes/alt) planlandı.  
  - Route Segment caching (Next 15) ve **tag-based revalidate** admin işlemleriyle entegre edilecek.

---

## 5) Test ve Kalite
- **Playwright E2E**: SEO smoke testleri çalışıyor; bazı testler **bilerek** ikinci planda (dinamik veri gelince stabilize edilecek):
  - `robots.txt` alan validasyonu, `sitemap.xml` erişimi ✅
  - Favicon içerik türleri & 200 dönüşü ✅
  - JSON-LD geniş şema alanları ❗(dinamik veri sonrası tamamlama)
  - Social links/hreflang canonical varyasyonları gözden geçirilecek.
- **A11y (erişilebilirlik):** Başlık hiyerarşisi, `alt` metinleri, landmark’lar — **kontrol listesi** aşağıda.

---

## 6) Operasyonel Konular
- **Çevre Değişkenleri:** Sadece gerçekten runtime bağımlı min. alanlar ENV’den; diller **ENV’den değil**, **tek dosyadan**.
- **Günlükleme/Telemetri:** GA ölçümleri var; Consent akışı ile **anonymize_ip** ve **cookie banner** planı.
- **Güvenlik:** HSTS/canonical host korundu; **Content-Security-Policy** ve **Referrer-Policy** sertleştirilecek.

---

## 7) Yol Haritası (Kısa/Orta Vade)
### 7.1. Kısa Vade (1–2 sprint)
- [ ] **Admin invalidation:** RTK mutation → `revalidateTag`/`unstable_cache` ile canlıya anlık yansıtma.
- [ ] **JSON-LD genişletme:** Product/Article/Breadcrumb/FAQ (modül bazlı şablonlar).
- [ ] **`next/image`** dönüşümü: kritik listeler ve detay sayfaları.
- [ ] **Sitemap detaylandırma:** Modül bazlı alt-sitemap’ler + lastmod.
- [ ] **A11y pass:** Renk kontrastı, focus ring, skip links, form label/kontrol.

### 7.2. Orta Vade (3–5 sprint)
- [ ] **i18n yönetim paneli:** UI anahtarlarının sürümlenmesi & eksik anahtar uyarıları.
- [ ] **Arama & filtre:** List sayfalarında kategori/etiket/sort + server-side param sync.
- [ ] **Görsel optimizasyon pipeline:** Cloudinary/Thumbor varyantları, LQIP/placeholder.
- [ ] **CICD:** Preview deploy (PR), otomatik e2e smoke, Lighthouse raporu.
- [ ] **İleri seviye güvenlik başlıkları:** CSP nonce/strict-dynamic (kademeli uygulama).

---

## 8) Sürdürme İçin Kontrol Listeleri
### 8.1. Sayfa Geliştirirken
- [ ] `generateMetadata` deterministik mi? (Boş meta yok)
- [ ] UI metinleri **safe t** mi? (default param verildi mi?)
- [ ] İçerik alanları **strict** mi? (aktif dil dışında gösterim yok)
- [ ] Pretty URL ve redirect’ler doğru mu?
- [ ] Görsel `alt` mantıklı mı? (title boşsa slug)

### 8.2. Veri Katmanı
- [ ] RTK query endpoint → `buildCommonHeaders(locale)` kullanıyor mu?
- [ ] RSC fetcher → `resolveTenant()` / `normalizeLocale()` / `no-store` ayarlı mı?
- [ ] `revalidate` politikası sayfa tipine uygun mu?

### 8.3. SEO & Yapılandırılmış Veri
- [ ] Canonical/hreflang setleri tam mı?
- [ ] JSON-LD minimum alanlar dolu mu?
- [ ] Sitemap güncel mi (lastmod + absolute URL)?

### 8.4. Erişilebilirlik
- [ ] Tek bir H1, anlamlı başlık hiyerarşisi
- [ ] Etkileşimli alanlarda klavye erişimi
- [ ] Kontrast oranı (WCAG AA)

---

## 9) Örnek Kod Parçaları (Kısa)
```ts
// İçerik için strict okuma
const pickStrict = (tf: TranslatedField | undefined, locale: SupportedLocale) => tf?.[locale] ?? "";

// UI için safe t
async function getSafeT(locale: SupportedLocale) {
  try {
    const t = await getTranslations({ locale, namespace: "pages.x" });
    return (key: string, values?: Record<string, any>) => {
      try {
        const out = (t as any)(key, values);
        return typeof out === "string" && out.trim() ? out : (values?.default ?? key);
      } catch { return values?.default ?? key; }
    };
  } catch { return (k: string, v?: any) => v?.default ?? k; }
}
```

---

## 10) Riskler & Notlar
- **Eksik i18n anahtarları** prod’da UI boşluklarına yol açmıyor (safe t), fakat içerikte **bilinçli olarak** boş bırakıyoruz; içerik eksikse görünür şekilde eksik kalacak (iş kuralı).
- **Admin entegrasyonu** tamamlanana kadar `revalidate` gecikmesi olabilir (5 dk).
- **E2E testleri** dinamik veri oturduğunda stabilize edilecek.

---

## 11) Sonuç
- Çekirdek mimari ve paternler **tamamlandı**.  
- Her yeni modül/sayfa, bu paternle hızla eklenebilecek.  
- Kısa vadede admin invalidation + JSON-LD genişletme + görüntü optimizasyonu ile **SEO/performans** daha da güçlenecek.


---

## 📸 Ekran Görüntüleri (Kanıt & Referans)
Aşağıya önemli ekran görüntülerini ekleyelim. Başlık ve kısa açıklama ile birlikte versiyon ve tarih belirtelim.

> Not: Görselleri eklerken dosya adını ve ilgili PR/commit linkini ekleyelim.

1. **Lighthouse – Ana Sayfa (Tr)**  
   - Dosya: `screens/lighthouse-home-tr-<tarih>.png`  
   - Özet: İlk ölçüm; SEO 7x, Performance xx…
2. **/tr/about – Liste**  
   - Dosya: `screens/about-list-tr-<tarih>.png`  
   - Özet: SSR liste + hreflang + canonical doğrulandı.
3. **/tr/about/[slug] – Detay**  
   - Dosya: `screens/about-detail-tr-<slug>-<tarih>.png`  
   - Özet: Dil fallback kapalı, slug fallback etkin; JSON-LD & meta tamam.
4. **/tr/products – Liste**  
   - Dosya: `screens/products-list-tr-<tarih>.png`  
   - Özet: SSR liste; grid ve alt metinler ok.


## 🧩 Kod Blokları (Örnek & Referans)
Aşağıdaki snippet’ler mimariyi anlatmak ve gelecekte referans olmak için eklendi.

### `src/lib/about/api.server.ts` (özet)
```ts
export async function fetchAboutBySlugServer(slug: string, locale?: SupportedLocale, cookie?: string) {
  const url = await abs(`about/slug/${encodeURIComponent(slug)}`);
  const tenant = await resolveTenant();
  const l = normalizeLocale(locale);
  const r = await fetch(url, {
    headers: { ...buildCommonHeaders(l, tenant), ...(cookie ? { cookie } : {}) },
    credentials: "include",
    cache: "no-store",
  });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`about bySlug failed: ${r.status}`);
  const j = (await r.json()) as ApiEnvelope<IAbout>;
  return j.data ?? null;
}
```

### `app/[locale]/(public)/about/[slug]/page.tsx` (strict dil okuma)
```tsx
const pickStrict = (tf: TranslatedField | undefined, locale: SupportedLocale) => tf?.[locale] ?? "";
// ...
const title = pickStrict(item.title, locale);
const summary = pickStrict(item.summary, locale);
const content = pickStrict(item.content, locale);
```

### RTK Query – Products (özet)
```ts
export const productsApi = createApi({
  reducerPath: "productsApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["Product", "ProductList", "ProductCategory"],
  endpoints: (b) => ({
    list: b.query<IEnsotekprod[], ProductListParams | void>({ /* ... */ }),
    bySlug: b.query<IEnsotekprod, ProductBySlugParams>({ /* ... */ }),
    categories: b.query<EnsotekCategory[], { locale?: SupportedLocale } | void>({ /* ... */ }),
  }),
});
```


## 👥 Sahiplik / RACI
| Alan | R (Sorumlu) | A (Onaylayan) | C (Danışılan) | I (Bilgilendirilen) |
|---|---|---|---|---|
| i18n (next-intl + common types) | Orhan | Orhan | — | Ekip |
| SSR/RSC veri çekme (server utils) | Orhan | Orhan | — | Ekip |
| RTK Query client uçları | Orhan | Orhan | — | Ekip |
| SEO meta + JSON-LD | Orhan | Orhan | — | Ekip |
| Lighthouse takibi | Orhan | Orhan | — | Ekip |
| Testler (Playwright) | Orhan | Orhan | — | Ekip |

> Gerektikçe alanlara ikinci sorumlu eklenebilir.


## 🛣️ Yol Haritası – Kısa Orta Uzun
### Kısa (1–2 sprint)
- [ ] Products & Spare-parts sayfaları için **strict i18n** tamamlanması
- [ ] News & Library list/detay SSR + meta
- [ ] References liste (logo grid) + kategori filtresi
- [ ] SEO E2E: robots/sitemaps/schema-org alt kırmızıları düzeltme
- [ ] Favicons testindeki content-type düzeltmesi

### Orta (3–5 sprint)
- [ ] Admin’den gelen **dinamik SEO** alanlarının entegrasyonu (title/desc/og)
- [ ] Revalidate/Tag invalidation (admin publish → FE tazeleme)
- [ ] Görsel optimizasyon: next/image + responsive sizes
- [ ] İçerik detaylarında **TOC** ve dahili linkleme

### Uzun (5+ sprint)
- [ ] Çoklu tenant senaryosu (X-Tenant switching) için test matrisi
- [ ] Edge caching + stale-while-revalidate stratejisi
- [ ] Arama (SearchAction) endpointi ve site-içi arama sonuç sayfası


## ✅ Sürekli Kontrol Listesi (Her PR’da)
- [ ] Sayfa SSR/RSC çalışıyor mu? (No client waterfall)
- [ ] i18n anahtarları mevcut mu? (strict, fallback yok)
- [ ] Canonical + hreflang + OG/Twitter tam mı?
- [ ] JSON-LD valid mi? (ld-json test)
- [ ] IMG alt’lar dolu mu? (decorative hariç)
- [ ] Route’lar sitemap/robots altında görünüyor mu?
- [ ] Lighthouse (Perf/SEO/Best) skor ekranı eklendi mi?


## 🔗 İlgili Dosyalar (hızlı erişim)
- `src/lib/about/api.server.ts`
- `src/lib/about/api.client.ts`
- `src/app/[locale]/(public)/about/page.tsx`
- `src/app/[locale]/(public)/about/[slug]/page.tsx`
- `src/lib/products/*` – client/server/types
- `src/app/[locale]/(public)/products/*`
- `tests/e2e/*` – Playwright testleri



## Dikkat Edilecek Hususlar — Deterministik & Future‑Proof Kodlama

### 1) Tek Kaynaktan Dil Yönetimi (Single Source of Truth)
- **Hiçbir dosyada dil listesi hard‑code edilmez.** Her yerde `SUPPORTED_LOCALES`, `LANG_LABELS`, `LOCALE_MAP` **yalnızca** `@/types/common`’dan import edilir.
- Yeni dil ekleme akışı: yalnızca common dosyası güncellenir → UI/SEO/i18n tüm yerler otomatik etkilenir (hreflang, sitemap, menü, switcher, API header’ı).
- **Anti‑pattern:** `['tr','en','de']` gibi diziler; `switch(locale)` ile dil bazlı if‑else ağaçları.
- **Kod örneği (doğru):**
  ```ts
  import { SUPPORTED_LOCALES } from "@/types/common";
  const hrefLangLinks = SUPPORTED_LOCALES.map(l => ({ hrefLang: l, href: absoluteUrl(`/${l}`) }));
  ```

### 2) Deterministik i18n Kullanımı
- **UI metinleri:** `getTranslations()` ile; key yoksa hata yakalanıp *bilinçli* default gösterilecek yapı (getSafeT) yalnızca sayfa kabuğunda. İçerik metinlerinde **fallback yok** (strict read).
- **İçerik (BE’den gelen TranslatedField):** `pickTextStrict(tf, locale)` → **yalnızca aktif dil**. Boşsa UI’da alan gizlenir, başka dile düşmez.
- **SEO metadata:** İçerik boşsa bile title/description için yalnızca UI çeviri fallback’i kullanılabilir; içerik fallback’i yapılmaz.

### 3) SSR/RSC–CSR Ayrımı ve API Katmanları
- **Server (RSC/SSR)**: `lib/**/api.server.ts` → `fetch*Server()` (tenant, Accept‑Language, cookie pass‑through, cache stratejisi).
- **Client (CSR)**: RTK Query `lib/**/api.client.ts` → `createApi + axiosBaseQuery` (interceptor’lar tenant/dil ekler).
- **Kural:** Server tarafında RTK Query çağrılmaz; Client tarafında `fetch()` ile manuel istek yapılmaz.

### 4) SEO İnvariantları (Her PR’da kırılmaması gerekenler)
- `<html lang>` = aktif locale.
- `canonical` → apex host + mutlak https; `og:url` = canonical.
- `hreflang` → **SUPPORTED_LOCALES’den** türetilir + `x-default`.
- JSON‑LD: `WebSite` + `Organization` sayfa bazlı ek; About/News/Library detayda ilgili `Article/BlogPosting`/`BreadcrumbList`.
- `robots.txt`, `sitemap*.xml` canonical host’ta, duplicate <loc> yok.

### 5) Tema / Tasarım Sistemi (Deterministik UI)
- **Design tokens:** CSS custom properties `--bg`, `--text`, `--accent` …; Tailwind config’te semantic token map.
- **Karanlık/Aydınlık:** `prefers-color-scheme` + kullanıcı seçimi; `data-theme` attribute ile override.
- **Erişilebilirlik:** Kontrast ≥ 4.5:1, focus ring asla kapatılmaz, `prefers-reduced-motion` saygı.
- **Görsel optimizasyonu:** `next/image` + `sizes` + `loading="lazy"/priority`; `.webp` öncelikli; `alt` zorunlu (decorative değilse).
- **Tipografi:** H1 tekil, sayfa başlığında; hiyerarşi sabit.

### 6) Performans & İlk Açılış (TTFB/LCP/CLS)
- **Data‑above‑the‑fold RSC**: kritik liste/ayrıntı verisi server’dan; client tarafında hydration sonrası ufak etkileşimler.
- **Route‑level revalidate**: listeler `revalidate = 300`; detaylarda `no‑store` veya kısa TTL; admin invalidation → `revalidateTag` planı.
- **Bundle hijyeni:** Client dosyalarında yalnız gerekli import; ortak yardımcılar (utils) server‑safe yazılır.
- **Third‑party**: GA/GTM consent‑gate; bloklanırsa render etkilenmez.

### 7) Test & Otomasyon Geliştirmeleri
- **Lighthouse budget** (json): LCP ≤ 2.2s, CLS ≤ 0.1, TBT ≤ 200ms.
- **Playwright kontrolleri:**
  - Hard‑coded locale tespiti (regex) — `src/**\/*.(ts|tsx)` içinde `\['[a-z]{2}'` kalıpları yasak.
  - hreflang, canonical, og/twitter meta, JSON‑LD sayısı ve alan doğrulaması.
  - Görsel `alt` zorunluluğu (decorative hariç).
- **CI:** PR’da `pnpm build && pnpm test:e2e:lighthouse` koşar.

### 8) Anti‑Pattern Listesi
- ❌ Dil dizilerini dosya içinde tanımlamak (`const LOCALES = ['tr','en']`).
- ❌ İçerik için başka dile düşmek (strict rule’u bozmak).
- ❌ Client’ta `fetch()` ile doğrudan BE çağrısı (RTK Query varken).
- ❌ SEO etiketlerini runtime’da farklı host ile kurmak (canonical sapması).

### 9) Yapılacaklar (Action Items)
1. **ESLint kuralı:** Hard‑coded locale dizisi yakalayan custom rule (veya lint‑staged grep blocker).
2. **Hreflang generator util:** `SUPPORTED_LOCALES` → `<link rel="alternate" hrefLang=...>` üretim fonksiyonu (tek yer).
3. **SiteJsonLd v2:** `WebSite`/`Organization` şemaları için tek util ve sayfa kombinasyonları.
4. **Theme tokens:** `:root[data-theme]` altında token’lar; Tailwind ile map.
5. **Playwright ek test:** JSON‑LD alanları ve canonical host cross‑check; no‑index flag senaryoları.

---

## Dil & Tema — Yapılacaklar Planı

### Dil (i18n)
- Common dosyası genişletildi: `SUPPORTED_LOCALES` (alfabetik) + `LANG_LABELS` + `LOCALE_MAP`.
- Menü, hreflang, dil seçici, sitemap, `Accept-Language` **tamamı** bu listeden türeyecek.
- Yeni dil ekleme checklist: common güncelle → BE’nin TranslatedField alanlarına içerik ekle → e2e testler çalıştır.

### Tema
- Token matrisi: renk, spacing, radius, shadow; dark/light varyant.
- Komponent kütüphanesi: `SectionScaffold`, Card, Button, Breadcrumb — token tüketir, inline stil kullanılmaz.
- Görsel yönergeleri: `sizes`, `priority` politikası; `.webp` ilk tercih; width/height belirtilir.

> Not: Bu bölüm PR şablonuna referans verilecek şekilde hazırlandı. Her PR’da “Deterministik i18n/SEO/Theme” kutuları işaretlenmeli.

