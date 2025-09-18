# TarifinTarifi – Faz 2 Planı (Admin + CRUD + Cloudinary)

## 0) Hedefler (MVP)

* **Admin-only** oturum (public kayıt kapalı).
* **Admin Panel UI** (Next.js) → tarifler için **CRUD**.
* Tariflere **kapak görseli + galeri** ekleme (Cloudinary).
* **JWT + Cookie** tabanlı oturum, **CSRF** koruması.
* Yayın durumu: **draft/published**.
* Standartlar & DevOps, mevcut rehberlerle uyumlu.

---

## 1) Kimlik Doğrulama Tasarımı

**Model**

* `User { email (unique), passwordHash, role: 'admin', active }`
* Seed: 1 adet admin kullanıcı.

**JWT Stratejisi**

* **Access Token:** 15 dk, `HttpOnly` cookie: `tt_at`.
* **Refresh Token:** 7 gün, rotasyonlu, `HttpOnly` cookie: `tt_rt`.
* Cookie bayrakları: `Secure` (prod), `SameSite=Lax`, `Path=/`.
* CSRF: **double-submit** veya `X-CSRF-Token` header + eşleşen `tt_csrf` cookie.

**Uçlar**

* `POST /api/auth/login` → set-cookie (tt\_at, tt\_rt), rate-limit.
* `POST /api/auth/refresh` → yeni tt\_at, tt\_rt.
* `POST /api/auth/logout` → cookie’leri temizle.
* `GET /api/auth/me` → oturum profilini döndürür.

**Middleware**

* `requireAdmin` → `role === 'admin'` kontrolü.
* CORS: sadece kendi origin (Next) → **whitelist**.&#x20;

---

## 2) Tarif CRUD (Backend)

**Şema Değişikliği**

* `images: { cover: ImageRef | null, gallery: ImageRef[] }`
* `ImageRef { publicId, secureUrl, width, height, bytes, format, alt? }`
* `status: 'draft'|'published'`, `publishedAt?`

**Uçlar (admin)**

* `GET /api/admin/recipes?page&limit&q&status&tag`
* `POST /api/admin/recipes` (create draft)
* `GET /api/admin/recipes/:id`
* `PUT /api/admin/recipes/:id` (tam güncelle)
* `PATCH /api/admin/recipes/:id/status` (publish/unpublish)
* `DELETE /api/admin/recipes/:id`

**Not:** Public API (liste/detay) mevcut uçlarla uyumlu kalır; yalnızca **published** döner. (Postman koleksiyonundaki public uçlarla uyumluluk korunur.)&#x20;

---

## 3) Cloudinary Entegrasyonu

**Env**

* `CLOUDINARY_CLOUD_NAME`
* `CLOUDINARY_API_KEY`
* `CLOUDINARY_API_SECRET`
* `CLOUDINARY_UPLOAD_FOLDER=recipes`
* (ops.) `CLOUDINARY_WEBHOOK_SECRET`

**İki Yöntem**

1. **İmzalı direkt yükleme (önerilen):**

   * `POST /api/uploads/cloudinary/sign` → `{timestamp, folder, public_id?, signature, api_key, cloud_name}` döner.
   * Admin UI, bu paramlarla **doğrudan Cloudinary**’e yükler (dosya trafiği backend’e binmez).
2. **Sunucuya yükle & ileri gönder:**

   * `POST /api/admin/recipes/:id/images` (multer/stream) → backend Cloudinary’e yükler.

**Politikalar**

* Maks. dosya boyutu (Nginx): `client_max_body_size 50M` (hazır).&#x20;
* Formatlar: jpg/png/webp; dönüşümler URL düzeyinde.
* Saklama: DB’ye **sadece** `publicId` (+ meta) yaz, URL’yi Cloudinary’den üret.
* (ops.) **Moderation/Webhook:** Başarılı yükleme sonrası webhook → DB güncelle.

---

## 4) Admin Panel (Frontend – Next.js + styled-components)

**Rotalar**

* `/admin/login`
* `/admin` (özet – toplam tarif, draft/published sayıları)
* `/admin/recipes`
* `/admin/recipes/new`
* `/admin/recipes/:id/edit`

**Bileşenler**

* **Login Form** (email+pass) → `fetch` (credentials: include) → cookie set.
* **Recipes Table** (arama, filtre: status/tag; sayfalama).
* **Recipe Editor**

  * Temel alanlar: başlık(lar), kategori, tag, süre, porsiyon, malzemeler, adımlar, açıklama.
  * **Kapak + Galeri**: Cloudinary upload widget/komponent, önizleme, silme.
  * **Yayınla** düğmesi (status toggle).
* **Guard**: `/admin/*` sayfalarında **middleware** → `/admin/login`’a yönlendir (SSR için `GET /api/auth/me` kontrolü).

**SEO/erişilebilirlik**: Admin özel; indexlenmez, buton/label/alt metinleri tam. (Genel rehbere uygun).&#x20;

---

## 5) Güvenlik & Operasyon

* **Helmet, rate-limit** (özellikle `/auth/login`), giriş denemesi sayacı.&#x20;
* **Loglama:** Prod’da JSON (pino/winston). Başarısız girişler, imza istekleri, yayın değişiklikleri **audit**.
* **PM2 & Nginx**: mevcut yapı ile uyumlu, reload/checklist korunur.&#x20;
* **Testler:**

  * Unit: auth servis, imza oluşturma.
  * Integration: admin CRUD, policy testleri.
  * Postman koleksiyonu: **Admin** klasörü eklenir (mevcut public koleksiyonu zaten var).&#x20;

---

## 6) Kabul Kriterleri (Definition of Done)

* Admin, `/admin/login` ile giriş yapar; cookie’ler güvenli set edilir.
* `/admin/recipes` üzerinde liste/arama/filtre/sayfalama çalışır.
* Yeni tarif oluşturma/düzenleme/silme akışları eksiksizdir.
* Cloudinary ile **kapak** ve **galeri** yükleme, önizleme, silme; DB’de `publicId` saklama.
* Public tarafta yalnızca **published** tarifler görünür; tasarım/SEO bozulmaz.
* CSRF koruması aktiftir; CORS yalnızca kendi origin’e izinlidir.
* PM2/Nginx altında sorunsuz deploy + healthcheck geçer.&#x20;

---

## 7) İş Parçacıkları (Sprint kırılımı)

1. **Auth (BE):** model, login/refresh/logout, middleware, rate-limit, CSRF.
2. **Admin Guard (FE):** `/admin` middleware, `auth/me` tüketimi.
3. **Recipe Schema + Admin Uçlar (BE):** CRUD, status publish.
4. **Admin UI Tablolar (FE):** liste/filtre/sayfalama.
5. **Editor (FE):** form + RHF/Yup (veya Zod), draft/save/publish.
6. **Cloudinary (BE+FE):** sign endpoint + upload komponenti.
7. **Public Doğrulama:** only published görünürlüğü.
8. **Test & Postman:** admin koleksiyonu, smoke e2e.
9. **Docs & Deploy:** ENV, README, checklist güncelleme.

---

## 8) ENV Örneği (eklenecek)

```
JWT_SECRET=...
JWT_REFRESH_SECRET=...
COOKIE_DOMAIN=tarifintarifi.com
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
CLOUDINARY_UPLOAD_FOLDER=recipes
```

Frontend tarafı mevcut `.env` düzeniyle uyumlu kalır (`NEXT_PUBLIC_API_BASE=/api`).&#x20;

---

İstersen, bunun üstüne **endpoint sözleşmesi** ve **Admin UI wireframe**’ini de çıkarıp aynı PR’da ilerleyelim.
