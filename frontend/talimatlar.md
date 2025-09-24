harika—aynı hedefteyiz. aşağıya “her sprint / her PR” tekrarlanabilir **SEO + ilk sayfa performansı** kontrol talimatlarını, küçük kod şablonlarıyla bıraktım. bunu proje wiki’sine aynen koyup herkese “checklist” olarak kullandırabilirsiniz.

# 0) Altın Kural (Özet)

* **İlk render = RSC/SSR/ISR ile veri dolu HTML.**
* **Client JS sadece etkileşim için.**
* **Meta/JSON-LD server’da üret.**
* **Görseller, fontlar, favicons optimize.**
* **Her PR’da Playwright + Lighthouse kısa turu.**

---

# 1) Sayfa Geliştirme Akışı (Her Yeni Route İçin)

## 1.1 Rota iskeleti (RSC, i18n, SEO)

* **Dosya**: `app/[locale]/(public)/<page>/page.tsx` (RSC)
* **Meta**: `generateMetadata` içinde locale’ye göre başlık + açıklama
* **Tek H1**: içerikte tek bir `<h1 id="page-title">…</h1>`
* **Breadcrumb (ops.)**: içerikte görsel yoksa da minimum metin

**Şablon:**

```ts
// app/[locale]/(public)/foo/page.tsx
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { DEFAULT_LOCALE, isSupportedLocale, SITE_URL, SITE_NAME, languageAlternates } from "@/i18n/locale-helpers";
import type { SupportedLocale } from "@/types/common";

export const revalidate = 300;
type Params = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale: SupportedLocale = isSupportedLocale(raw) ? raw : DEFAULT_LOCALE;
  const t = await getTranslations({ locale, namespace: "pages.foo" });

  const PATH = `/${locale}/foo`;
  const title = t("title", { default: "Foo" });
  const description = t("desc", { default: "Foo page." });
  const og = `${SITE_URL}/og.webp`;

  return {
    metadataBase: new URL(SITE_URL),
    title, description,
    alternates: { canonical: PATH, languages: languageAlternates(DEFAULT_LOCALE) },
    openGraph: { type:"website", siteName:SITE_NAME, locale, url: PATH, title, description, images:[og] },
    twitter: { card:"summary_large_image", title, description, images:[og] },
    robots: { index: true, follow: true },
  };
}

export default async function FooPage({ params }: { params: Params }) {
  const { locale: raw } = await params;
  const locale: SupportedLocale = isSupportedLocale(raw) ? raw : DEFAULT_LOCALE;
  const t = await getTranslations({ locale, namespace: "pages.foo" });

  return (
    <main style={{maxWidth:860, margin:"28px auto", padding:"0 16px"}}>
      <h1 id="page-title">{t("title", { default: "Foo" })}</h1>
      <p>{t("intro", { default: "Intro text…" })}</p>
    </main>
  );
}
```

## 1.2 Veri çekme (ilk render hızlı)

* **Kural:** ilk içerik **server**’da fetch → HTML dolu gelsin.
* `fetch(url, { next: { revalidate: 300, tags: ['foo'] } })` kullan.
* Admin güncellemesinde `revalidateTag('foo')`.

## 1.3 JSON-LD (Site genel + sayfa özel)

* **SiteJsonLd** (WebSite + Organization) **Layout**’ta.
* Sayfa özel (Breadcrumb/Collection/Article) gerekiyorsa sayfada **script** olarak ekle.

---

# 2) Bileşen Stratejisi

## 2.1 Navbar & Footer

* **Footer**: Server Component (etkileşim yok).
* **Navbar**: Menüyü **server**, arama gibi etkileşimleri **küçük client child**.
* Görseller `next/image` ( **unoptimized=false** bırakın; yani hiç vermeyin).
* Logo/alt zorunlu.

## 2.2 HomeView / Grid / List

* Statik yazılar RSC; filtreleme/sıralama gerekiyorsa **yalnız filtre barı client**.
* Büyük veriler için ilk “page=1” server’dan; sonraki sayfalar client fetch (RTKQ uygun).

---

# 3) Varlıklar (Assets)

## 3.1 Favicons (Kökte 200 dönmeli)

```
/public/favicon.ico
/public/favicon-32x32.png
/public/favicon-16x16.png
/public/apple-touch-icon.png
```

## 3.2 OG Görsel

* `/public/og.webp` (Lighthouse + testler için `.webp`)
* Meta’larda absolute URL: `${SITE_URL}/og.webp`

## 3.3 Fontlar

* **next/font** kullanın:

```ts
import { Inter } from "next/font/google";
export const inter = Inter({ subsets:["latin"], display:"swap" });
```

* Layout kök wrapper’a `className={inter.className}`.

---

# 4) Performans Ayarları

## 4.1 styled-components

`next.config.js`:

```js
export default {
  compiler: {
    styledComponents: { ssr: true, displayName: false, minify: true },
  },
};
```

Bu, CSS’in SSR gömülmesini ve CLS’in düşmesini sağlar.

## 4.2 Scripts

* **GAScripts** ve 3P script’leri `strategy="afterInteractive"` veya mümkünse `lazily` yükleyin.
* Preconnect sadece gerçekten dış domain kullanılıyorsa.

## 4.3 Resim boyutları

* `sizes` doğru ayarlansın, `priority` sadece LCP resmine.

---

# 5) Telemetri & Test Gereksinimleri

## 5.1 SEO Snapshot Cookie (test beklentisi)

* Layout’ta ufak bir client bileşeni:

```tsx
// features/analytics/SeoSnap.tsx
"use client";
import { useEffect } from "react";

export default function SeoSnap({ tenant="ensotek", pageKey="home", locale }:{tenant?:string;pageKey?:string;locale:string}) {
  useEffect(() => {
    try {
      const key = `seo_snap_${tenant}_${pageKey}_${locale}`;
      const val = JSON.stringify({ t: document.title, ts: Date.now() });
      document.cookie = `${key}=${encodeURIComponent(val)}; path=/; max-age=86400`;
    } catch {}
  }, [tenant, pageKey, locale]);
  return null;
}
```

* `app/[locale]/layout.tsx` içinde: `<SeoSnap locale={current} />`

## 5.2 Schema.org doğrulama

* `SiteJsonLd` Organization/Website JSON-LD **absolute** alanlar: `url`, `logo`, `sameAs[]`.
* `SearchAction.target`: `${base}/${locale}?q={search_term_string}`
* Testleriniz bunu arıyor.

---

# 6) Ortam Değişkenleri (Standart)

```
NEXT_PUBLIC_SITE_NAME=ensotek.de
NEXT_PUBLIC_DEFAULT_LOCALE=tr
NEXT_PUBLIC_SUPPORTED_LOCALES=tr,en,fr,de,it,pt,ar,ru,zh,hi,pl,es
NEXT_PUBLIC_CANONICAL_HOST=ensotek.de
NEXT_PUBLIC_ORG_SAMEAS=https://facebook.com/Ensotek,https://instagram.com/ensotek_tr
NEXT_PUBLIC_ORG_CONTACT_TELEPHONE=+49-xxx
NEXT_PUBLIC_ORG_CONTACT_TYPE=customer support
NEXT_PUBLIC_ORG_CONTACT_AREA=DE
NEXT_PUBLIC_ORG_CONTACT_LANGS=tr,en,de
```

---

# 7) PR Öncesi Hızlı Kontrol Listesi

**SEO & Head**

* [ ] `generateMetadata` var ve locale’ye bağlı title/desc üretiyor
* [ ] `canonical` → `https://<apex>/{locale}/…`
* [ ] `alternate hreflang` tüm desteklenen diller + `x-default`
* [ ] OG/Twitter meta dolu, `og:image` absolute ve **.webp**

**İçerik & Erişilebilirlik**

* [ ] DOM’da tek `<h1 id="page-title">`
* [ ] İlk 1–2 resimde `alt` dolu
* [ ] Linkler görsel metinle erişilebilir

**Performans**

* [ ] Sayfa RSC; ilk veri server’da
* [ ] Client bileşenler minimum, ağır kısım lazy
* [ ] `next/image` kullanılıyor; `unoptimized` verilmedi
* [ ] `next/font` ile font yüklendi
* [ ] styled-components SSR açık

**Varlıklar**

* [ ] `/public/og.webp` mevcut
* [ ] favicons 200 dönüyor

**JSON-LD**

* [ ] `SiteJsonLd` Layout’ta render
* [ ] (Gerekiyorsa) sayfa özel JSON-LD eklendi

**Telemetri**

* [ ] `SeoSnap` ilgili layout’a eklendi (home için en az)

---

# 8) CI / test & ölçüm (kısa tur)

**Playwright (mevcut test setiniz)**

* [ ] `npm run test:e2e` — *kırmızı testler sadece veri bağımlı olanlar olabilir, ancak `home-seo`, `og-twitter-hreflang`, `favicons`, `robots-sitemap-canonical`, `schema-org` ve `seo-cookie-telemetry` yeşil olmalı.*

**Lighthouse (local)**

* [ ] `npm run build && npm run start` ile prod simülasyonu
* [ ] Chrome DevTools Lighthouse: **Performance ≥ 95**, **SEO = 100** hedef
* [ ] LCP < 2.5s, CLS < 0.05

---

# 9) Backend’e bağlanınca (ileride)

* RSC fetch’lerde:

  * `next: { revalidate, tags }` kullan
  * JSON parse + boş data fallback, metada ile uyumlu
* Admin panel update → `revalidateTag` ile anında güncelle
* RTK Query’yi sadece liste filtreleme / kullanıcı etkileşimi için ekle

---
