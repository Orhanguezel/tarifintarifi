harika—eldeki modüller sabit kalıyor; üstüne **admin**, **auth (user)** ve **Cloudinary** katmanlarını ekleyip minimum kırılımla ilerleyelim. Aşağıya “dosya-bazlı değişiklik planı + endpoint sözleşmesi + kabul kriterleri + sprint kırılımı”nı net bıraktım.

# Faz 2 – Uygulama Planı

## 1) Yeni klasör ve dosyalar

```
src/
  modules/
    users/
      model.ts
      validation.ts
      controller.ts
      routes.ts
      types/index.ts
      service.ts            # password hash, token üretimi vb.
    admin/
      controllers/
        recipes.ts          # admin CRUD (recipes)
        comments.ts         # (opsiyonel) yorum moderasyon
      routes.ts             # /api/admin/* mount
    uploads/
      cloudinary.service.ts # server-side SDK wrapper + helpers
      routes.ts             # /api/uploads/cloudinary/sign, (ops.) /webhook
  middleware/
    auth/
      requireAuth.ts
      requireAdmin.ts
      issueTokens.ts        # access/refresh cookie’leri set eden helper
      csrf.ts               # double-submit veya header tabanlı
    rateLimit.ts
  utils/
    password.ts             # bcrypt/scrypt argon2
    jwt.ts                  # sign/verify
```

## 2) ENV değişkenleri (backend)

```
JWT_SECRET=...
JWT_REFRESH_SECRET=...
COOKIE_DOMAIN=tarifintarifi.com
COOKIE_SECURE=true
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
CLOUDINARY_UPLOAD_FOLDER=recipes
# (ops.) CLOUDINARY_WEBHOOK_SECRET=...
```

## 3) Var olan modüllerde yapılacaklar

### 3.1 `recipes` (mevcut dosyalarına dokunuş)

* **model.ts**

  * Şemaya medya alanları:

    ```ts
    images: {
      cover?: {
        publicId: string;
        secureUrl: string;
        width?: number;
        height?: number;
        bytes?: number;
        format?: string;
        alt?: string;
      } | null;
      gallery: Array<{
        publicId: string;
        secureUrl: string;
        width?: number;
        height?: number;
        bytes?: number;
        format?: string;
        alt?: string;
      }>;
      video?: {
        publicId: string;
        secureUrl: string;
        duration?: number;
        width?: number;
        height?: number;
        bytes?: number;
        format?: string;
        thumbnailUrl?: string;
      } | null;
    }
    status: { type: String, enum: ['draft','published'], default: 'draft' }
    publishedAt?: Date
    ```
* **validation.ts**

  * Zod (veya kullandığın şema aracı) ile `images`, `status` alanlarını ekle.
  * `createRecipeSchema` ve `updateRecipeSchema` için ayrı tipler; `images` alanı opsiyonel, `status` default `draft`.
* **controller.ts**

  * Public liste/detay **değişmeden** kalır fakat sadece `status: 'published'` döndür.
  * (Eğer arama/filtre varsa) `status` filtresi eklenecek.
* **routes.ts**

  * Public uçlar aynı kalır.
  * Admin uçlar **ayrı router**’da olacak (bkz. 4. bölüm), burada public olanları yalnızca `published` gösterecek şekilde koru.
* **recipes.md**

  * API sözleşmesini ve örnek istek/yanıtları güncelle (aşağıdaki sözleşmeyi kopyalayabilirsin).

### 3.2 `comments` ve `reactions`

* **Public taraf** aynı kalsın.
* (Opsiyonel) Admin moderasyon: `admin/controllers/comments.ts` içinde `list (q, status)`, `update status (approved/rejected)`; `admin/routes.ts`’a bağla.

## 4) Admin API (yeni)

* Mount noktası: **`/api/admin`** (global)
* Middleware: `requireAdmin` (+ `csrf` + `rateLimit`)

### 4.1 Admin – Recipes Controller (`src/modules/admin/controllers/recipes.ts`)

Uçlar:

* `GET /api/admin/recipes?page&limit&q&status&tag`
* `POST /api/admin/recipes` → draft oluşturur
* `GET /api/admin/recipes/:id`
* `PUT /api/admin/recipes/:id` → full update
* `PATCH /api/admin/recipes/:id/status` → body: `{ status: 'draft'|'published' }`
* `DELETE /api/admin/recipes/:id`

Medya operasyonu (iki seçenek):

1. **İmzalı direkt yükleme (önerilen)**

   * **Akış:** FE `/api/uploads/cloudinary/sign` → Cloudinary’e doğrudan yükle → FE `publicId`/meta ile `PUT /api/admin/recipes/:id` (images alanını güncelle).
2. **BE üzerinden yükleme** (gerekirse)

   * `POST /api/admin/recipes/:id/images` (multer/stream) → server Cloudinary’e yükler → DB’yi günceller.

### 4.2 Admin – Comments Controller (opsiyonel)

* `GET /api/admin/comments?page&limit&q&status`
* `PATCH /api/admin/comments/:id/status` → `{ status: 'approved'|'rejected' }`
* (İsteğe bağlı) `DELETE`

### 4.3 `src/modules/admin/routes.ts`

```ts
import { Router } from 'express';
import { requireAdmin } from '@/middleware/auth/requireAdmin';
import * as Recipes from './controllers/recipes';
import * as Comments from './controllers/comments';

const r = Router();
r.use(requireAdmin);

// recipes
r.get('/recipes', Recipes.list);
r.post('/recipes', Recipes.create);
r.get('/recipes/:id', Recipes.detail);
r.put('/recipes/:id', Recipes.update);
r.patch('/recipes/:id/status', Recipes.updateStatus);
r.delete('/recipes/:id', Recipes.remove);

// comments (ops.)
r.get('/comments', Comments.list);
r.patch('/comments/:id/status', Comments.updateStatus);

export default r;
```

> Not: **Ana `app.ts`’de** `app.use('/api/admin', adminRoutes)` olarak bağlayacağız.

## 5) Auth + User Modülü

### 5.1 User şeması (`src/modules/users/model.ts`)

```ts
User {
  email: string (unique, required)
  passwordHash: string
  role: 'admin' | 'editor' | 'viewer'  // MVP: 'admin' yeterli
  active: boolean (default: true)
  // (ops.) name, lastLoginAt, failedAttempts, lockedUntil, ...
}
```

### 5.2 User doğrulama (`src/modules/users/validation.ts`)

* `loginSchema`: `{ email, password }`
* (ops.) `createAdminSchema` (seed veya panelden ekleme)

### 5.3 Auth akışı

* **Cookies**:

  * `tt_at` (Access, 15dk, HttpOnly, Secure, SameSite=Lax, Path=/)
  * `tt_rt` (Refresh, 7gün, HttpOnly, Secure, SameSite=Lax, Path=/)
  * `tt_csrf` (CSRF token, non-HttpOnly)
* **Uçlar (`src/modules/users/routes.ts`)**

  * `POST /api/auth/login` → email+pass; set-cookie (tt\_at, tt\_rt, tt\_csrf)
  * `POST /api/auth/refresh` → rotate refresh; yeni tt\_at, tt\_rt
  * `POST /api/auth/logout` → cookie clear
  * `GET /api/auth/me` → aktif admin bilgisini döndür
* **Middleware**

  * `requireAuth`: `tt_at` doğrular, `req.user` set eder.
  * `requireAdmin`: `requireAuth` + `user.role === 'admin'`.
  * `csrf`: `X-CSRF-Token` header == `tt_csrf` cookie.
* **Service**

  * `password.ts`: hash/verify (argon2 **önerilir**, alternatif bcrypt).
  * `jwt.ts`: `signAccess`, `signRefresh`, `verify`.
  * `issueTokens.ts`: cookie set/clear helper’ları.

### 5.4 Seed

* **CLI veya script**: `create-admin.ts` → ilk admin kullanıcısını oluşturur (email+parola).

## 6) Cloudinary entegrasyonu

### 6.1 Server-side servis (`uploads/cloudinary.service.ts`)

* `getSignedUploadParams({ folder, publicId? })` → timestamp + signature üretir.
* (ops.) `deleteAsset(publicId)` ve `getTransformedUrl(publicId, opts)` yardımcıları.

### 6.2 Upload route (`uploads/routes.ts`)

* `POST /api/uploads/cloudinary/sign` → **requireAdmin + csrf**
  **Yanıt:**

  ```json
  {
    "cloudName": "...",
    "apiKey": "...",
    "timestamp": 1699999999,
    "signature": "...",
    "folder": "recipes",
    "publicId": "recipes/abc123"
  }
  ```
* (ops.) `POST /api/uploads/cloudinary/webhook` → güvenli doğrulama + DB güncellemesi.

### 6.3 Kullanım akışı (önerilen)

1. Admin UI **sign** ister → `sign` yanıtını alır.
2. FE, dosyayı direkt Cloudinary’e yükler.
3. Yükleme sonucu (publicId, width, height, bytes, format, secure\_url) FE’de hazır olur.
4. FE, `PUT /api/admin/recipes/:id` ile `images.cover` veya `images.gallery`’yi günceller.

## 7) Güvenlik, Rate Limit ve Loglama

* **Rate limit**: `/api/auth/login` ve `/api/uploads/cloudinary/sign` için sıkı limit.
* **Helmet** + CORS whitelist (sadece frontend origin).
* **Audit log**: giriş denemeleri, publish/depublish, media ekleme/silme.
* **Nginx**: `client_max_body_size 50M` – direkt uploadta çoğu trafik Cloudinary’e gider ama yine de güvenli.

## 8) Endpoint sözleşmesi (özet)

### Auth

* `POST /api/auth/login`
  body: `{ email, password }` → 200 + set-cookie
  fail: 401
* `POST /api/auth/refresh` → 200 + rotate cookies, yoksa 401
* `POST /api/auth/logout` → 204 (cookies clear)
* `GET /api/auth/me` → `{ email, role }`

### Uploads

* `POST /api/uploads/cloudinary/sign` (admin)
  body: `{ folder?: string, publicId?: string }` → `{ cloudName, apiKey, timestamp, signature, folder, publicId }`

### Admin – Recipes

* `GET /api/admin/recipes?page&limit&q&status&tag` → `{ items, page, total }`
* `POST /api/admin/recipes` → `{ id }`
* `GET /api/admin/recipes/:id` → recipe
* `PUT /api/admin/recipes/:id` → recipe (güncel)
* `PATCH /api/admin/recipes/:id/status` → `{ status, publishedAt? }`
* `DELETE /api/admin/recipes/:id` → 204

### Public – Recipes (mevcutlar)

* `GET /api/recipes?...` → sadece `published`
* `GET /api/recipes/:slugOrId` → `published` değilse 404

## 9) Dosya-bazlı yapılacaklar (çeklist)

**Var olanlar**

* `src/modules/recipes/model.ts` → `images`, `status` alanları eklenecek.
* `src/modules/recipes/validation.ts` → `images` + `status` şema güncellemeleri.
* `src/modules/recipes/controller.ts` → public endpointler `published` filtreli.
* `src/modules/recipes/routes.ts` → public rotalar aynı; admin rotalar ayrı dosyada.

**Yeni**

* `src/modules/admin/controllers/recipes.ts` + `src/modules/admin/routes.ts`
* `src/modules/users/*` (model, controller, routes, validation, service)
* `src/middleware/auth/*` (requireAuth, requireAdmin, csrf, issueTokens)
* `src/uploads/cloudinary.service.ts` + `src/uploads/routes.ts`
* (ops.) `src/modules/admin/controllers/comments.ts`

**Uygulama girişi**

* `app.ts` (veya `server.ts`):

  ```ts
  app.use('/api/auth', userRoutes);
  app.use('/api/uploads', uploadRoutes);
  app.use('/api/admin', adminRoutes); // middleware: requireAdmin içinde
  ```

## 10) Test & Postman

* Postman koleksiyonuna **Auth**, **Uploads**, **Admin/Recipes** klasörleri ekle.
* En azından şu smoke testler:

  1. Login → `me`
  2. Create draft recipe → put fields → sign → upload (manual) → update images
  3. Publish → public listte görünüyor mu?
  4. Unpublish → publicte kayboluyor mu?
  5. Logout → `me` 401

## 11) Kabul Kriterleri (DoD)

* Admin cookie-tabanlı login/refresh/logout eksiksiz.
* `/api/admin/recipes` CRUD + publish/unpublish çalışıyor.
* Cloudinary üzerinden **kapak** & **galeri** ekleme akışı stabil.
* Public uçlar **sadece published** döndürüyor.
* Rate limit, CSRF ve CORS konfigürasyonları aktif.
* İlk admin seed ile oluşturulabiliyor.
* Postman koleksiyonu güncel ve yeşil.

## 12) Sprint kırılımı (öneri)

1. **Auth + Users** (model, routes, cookies, csrf, rate-limit, seed)
2. **Recipes schema + public filtre** (status/images)
3. **Admin/Recipes** CRUD + status toggle
4. **Cloudinary sign + FE akışını besleyen alanlar (publicId/meta)**
5. **Yorum moderasyon (ops.)** + audit/loglama
6. **Postman + e2e smoke** + dokümantasyon

---

İstersen ilk PR’da **Users/Auth + Admin/Recipes (kapaksız)** çıkaralım; ikinci PR’da **Cloudinary**’yi ekleyip images alanlarını bağlarız. Bu planla dosya-dosya ilerler, minimum refactor’la Faz 2’yi kapatırız.
