Aşağıya “TarifinTarifi” için pratik ve uygulanabilir **mühendislik standartları** bıraktım. Bunlar; kod kalitesi, güvenlik, i18n, API tasarımı, SEO, test ve operasyonu kapsıyor. Takım içinde “tek kaynak” olarak kullanabilirsiniz.

# 1) Kod Stili & TS Kuralları

* **Dil/araçlar:** TypeScript (strict), Bun (geliştirme), Node 20+ (runtime), ESLint + Prettier.
* **TS:** `strict: true`, `noImplicitAny: true`, `noUncheckedIndexedAccess: true`, `esModuleInterop: true`, `resolveJsonModule: true`.
* **İsimlendirme:** dosyalar-kebap, değişkenlerCamel, sınıflarPascal.
* **İthalat yolları:** `@/*` alias (root: `src`).
* **Yan etkisiz modüller:** saf helper’lar state tutmaz.
* **Null güvenliği:** `??` ve `?.` tercih et; runtime guard ekle.
* **Asla:** `any` (istisna varsa tip daralt), `// @ts-ignore` (PR’da gerekçesiz yasak).

# 2) Git & PR Disiplini

* **Branch modeli:** `main` (prod), `dev` (staging), `feature/<konu>`, `hotfix/<konu>`.
* **Commit mesajı:** Conventional Commits – `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`.
* **PR kriteri (DoD):**

  * Unit/integration testleri geçti.
  * ESLint/TypeCheck temiz.
  * Log ve hata mesajları net.
  * Geriye dönük uyumluluk (varsayılan).
  * Değişiklikler docs/CHANGELOG’da.

# 3) Backend (Express + Mongoose)

* **Katmanlar:** `routes` → `controller` → `service` → `model` → `utils`.
* **Schema ayarları:** `timestamps: true`, `versionKey: false`, gerekli alanlara `index`.
* **Mongo indexleri:** arama alanları (slug, title.*, tags.*), text index opsiyonel (`RECIPES_USE_TEXT_SEARCH`).
* **Lean sorgu:** read path’te `.lean()` kullan.
* **Validation:** dış dünya → `zod`/custom guard; DB’ye girmeden doğrula.
* **Güvenlik:**

  * `helmet`, `cors` (whitelist env), `express-rate-limit`.
  * Captcha (Enterprise) guard’ı; bypass sadece dev.
  * Giriş verisi normalize/sanitize (özellikle HTML, URL, email).
* **Cache & hız:** `Cache-Control` header’ları env’den; kritik listelemelerde sayfalama zorunlu.
* **Log:** dev → `morgan`, prod → JSON structured log (pino/winston önerilir).
* **Hata formatı (tek biçim):**

  ```json
  { "success": false, "message": "human_readable", "code": "ERR_KEY", "errors": { "field": "msg" } }
  ```
* **Başarı yanıtları:**

  ```json
  { "success": true, "message": "ok_key", "data": {...}, "meta": {...} }
  ```
* **HTTP kodları:** 2xx başarı, 4xx istemci, 5xx sunucu. 422 doğrulama, 429 rate limit.

# 4) API Tasarımı

* **Kaynaklar:** `/api/recipes`, `/api/comments`, `/api/reactions`.
* **Sayfalama:** `?page=1&limit=50` → `meta: { page, limit, total, totalPages, hasPrev, hasNext }`.
* **Sıralama/Filtre:** açık parametreler; bilinmeyen parametreleri yoksay.
* **Idempotent uçlar:** toggle/set ayrımı net.
* **Alan seçimi:** `?fields=title,slug,totalMinutes` destekle (beyaz liste).

# 5) Uluslararasılaştırma (i18n)

* **Diller:** `tr,en,fr,de,it,pt,ar,ru,zh,hi` (env ile yönet).
* **Veri modeli:** Çok dilli alanlar `{ [locale]: string }`.
* **Eksik dil doldurma:** mümkünse otomatik çeviri → boşsa kaynak dilden kopyala (fail-safe).
* **Anahtar adları:** `home.search.placeholder`, `legal.privacy.title` gibi hiyerarşik.
* **RTL desteği:** `ar` için `dir="rtl"`; bileşenlerde metin yönü duyarlı.
* **Çeviri temizliği:** HTML gömme yok; placeholder’lar `{name}` formatı.

# 6) Frontend (Next.js + next-intl + styled-components)

* **App yapısı:** `/app/[locale]` segmenti; `generateMetadata` ile **locale bazlı** SEO.
* **SEO:** `title.template`, `alternates.languages`, OG/Twitter görselleri, `x-default`.
* **Performans:** `next/image`, statik asset’lerde cache, kritik CSS minimal.
* **Erişilebilirlik:** doğru `aria-*`, form label’ları, odak hiyerarşisi.
* **Stil:** styled-components, tema üzerinden renk/spacing; inline renk yok.
* **API erişimi:** yalnızca `NEXT_PUBLIC_API_BASE` üzerinden; sabit URL hardcode yok.

# 7) Güvenlik & Gizlilik

* **Secrets:** `.env` dosyaları git’te yok; prod’da yalnızca gerekli değişkenler.
* **CORS:** env whitelist; wildcard yok.
* **Rate limit:** genel + endpoint bazlı kotalar.
* **Kişisel veri:** e-posta/IP hash (salted), ham IP log’lama yok.
* **Bağımlılıklar:** düzenli `bun install` ve audit; gereksiz paket ekleme.

# 8) Test & Kalite

* **Test piramidi:** unit (utils/services), integration (controllers/routes, supertest), e2e (Playwright).
* **Örnek veri:** factory/helper; gerçek DB yerine test DB (in-memory Mongo) tercih.
* **CI adımları:** typecheck → lint → unit → integration → build.
* **Hata geri dönüşü:** testlerde i18n bağımlılığını mock’la.

# 9) Operasyon (PM2, Nginx, İzleme)

* **PM2:** `ecosystem.config.js`, `node_args: -r module-alias/register`, `pm2 save`, `pm2 startup`.
* **Reverse proxy:** Nginx HTTP→app; gerçek IP için `X-Forwarded-*` header’ları.
* **Healthcheck:** `/healthz` lightweight; DB ping opsiyonel.
* **Log rotasyonu:** pm2-logrotate veya sistem logrotate; PII yazma.
* **Hata izleme:** Sentry/Elastic (opsiyonel).

# 10) Performans Prensipleri

* **DB:** gerekli her sorguya index; `.select()` ile alan daralt; `.lean()` yoğun listelerde.
* **API:** N+1 önleme (toplu sorgu), sayfalama zorunlu, ağır işlemlerde kuyruk (opsiyonel).
* **Cache:** HTTP cache header’ları + reverse proxy cache (SWR penceresi env’den).

# 11) LLM Kullanımı (AI özellikleri)

* **Deterministiklik:** `temperature ≤ 0.35`, `forceJson`.
* **Girdi temizliği:** prompt’a kullanıcı girdisi eklerken trim/sanitize.
* **Çıktı doğrulama:** `extractJsonSafe` + `zod` şeması; eksik alanları fail-safe doldur.
* **Kota:** rate limit + istek başı token sınırı; hata durumunda kullanıcıya sade mesaj.

# 12) Dökümantasyon

* **README:** kurulum, komutlar, .env örneği.
* **API dokümanı:** Postman koleksiyonu / OpenAPI (tercihen).
* **CHANGELOG:** Conventional Commits’tan üretilebilir.
* **Kod içi:** TSDoc kısa açıklamalar; karmaşık fonksiyonlara JSDoc.

---
