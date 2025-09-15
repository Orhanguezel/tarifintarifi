# tariftarif# tarifteyiz
# TarifinTarifi · Açık Kaynak Tarif Platformu

Çok dilli, SEO-dostu ve hızlı bir **tarif keşif & paylaşım** platformu.
Frontend **Next.js (App Router, SSR)**, backend **Node.js + MongoDB**, paket yöneticisi **Bun**, süreç yönetimi **PM2** ile gelir.
Yorumlarda spam koruması için **reCAPTCHA Enterprise** kullanır.

> Canlı örnek: **tarifintarifi.com** (örnek adres — kendi domain’inizle barındırın)

---

## ✨ Özellikler

* 🌍 **Çok dilli** arayüz (TR başta olmak üzere birden çok dil)
* ⚡️ **SSR + statik optimizasyon** (Next.js)
* 🔎 Tarif arama, hızlı kategori filtreleri
* 🧮 Puanlama / beğeni / yorum sistemi
* 🛡 reCAPTCHA Enterprise ile **spam koruması**
* 📦 API & Frontend **ayrı** (temiz ayrışmış mimari)
* 🧰 **Bun** ile hızlı geliştirme, **PM2** ile prod yönetimi
* 🧪 Tip güvenliği: **TypeScript** uçtan uca

---

## 🧱 Teknoloji Yığını

* **Frontend:** Next.js (App Router), Styled-Components, RTK Query, TypeScript
* **Backend:** Node.js (Express/Fastify tarzı), TypeScript, MongoDB
* **Altyapı:** Bun, PM2, Nginx (opsiyonel reverse proxy), reCAPTCHA Enterprise

---

## 📂 Depo Yapısı

```
/ (repo kökü)
├─ backend/   # API (Node.js + MongoDB)
└─ frontend/  # Next.js (SSR) – /api isteklerini backend'e proxy eder
```

---

## 🚀 Hızlı Başlangıç

### 0) Önkoşullar

* **Bun** ≥ 1.1 (`bun --version`)
* **PM2** (global) – `npm i -g pm2`
* **MongoDB** (çalışır durumda)

### 1) Depoyu klonla

```bash
git clone https://github.com/kazatlet/tarifintarifi.git
cd tarifintarifi
```

### 2) .env dosyaları

Aşağıdaki örnekleri **kendinize göre** doldurup kaydedin:

**backend/.env**

```ini
PORT=5035
NODE_ENV=development
DEFAULT_LOCALE=tr
BASE_URL=http://localhost:5035

CORS_ORIGIN=http://localhost:3000,http://localhost:3001
FRONTEND_URL=http://localhost:3000

MONGO_URI=mongodb://tarif_user:<PASSWORD>@localhost:27017/tariftarif?authSource=tariftarif

RECIPES_USE_TEXT_SEARCH=true
RECIPES_PUBLIC_CACHE_MAX_AGE=60
RECIPES_PUBLIC_S_MAXAGE=300
RECIPES_PUBLIC_STALE_WHILE_REVALIDATE=600
RECIPES_PUBLIC_WINDOW_MS=60000
RECIPES_PUBLIC_LIST_MAX=120
RECIPES_PUBLIC_DETAIL_MAX=200
RECIPES_PUBLIC_GENERATE_MAX=10
RECIPES_PUBLIC_SEARCH_MAX=200
RECIPES_ADMIN_WINDOW_MS=60000
RECIPES_ADMIN_MAX=60

LLM_PROVIDER=groq
GROQ_API_KEY=<GROQ_API_KEY>
GROQ_MODEL=llama-3.3-70b-versatile

RECIPES_SUBMIT_API_KEY=<SERVER_SIDE_SUBMIT_KEY>

# reCAPTCHA Enterprise (opsiyonel – prod’da önerilir)
RECAPTCHA_ENTERPRISE_API_KEY=<GCP_SERVER_API_KEY>
GOOGLE_CLOUD_PROJECT_ID=<GCP_PROJECT_ID>
RECAPTCHA_EXPECTED_ACTION=comment_create
RECAPTCHA_MIN_SCORE=0.5

# Sadece geliştirme için:
CAPTCHA_BYPASS_TOKEN=dev-bypass-123
```

**frontend/.env**

```ini
# i18n & Site
NEXT_PUBLIC_SUPPORTED_LOCALES=tr,en,fr,de,it,pt,ar,ru,zh,hi
NEXT_PUBLIC_DEFAULT_LOCALE=tr
NEXT_PUBLIC_SITE_NAME=tarifintarifi.com
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_CONTACT_EMAIL=support@example.com

# API & Proxy
BACKEND_ORIGIN=http://127.0.0.1:5035
NEXT_PUBLIC_BACKEND_ORIGIN=http://127.0.0.1:5035
NEXT_PUBLIC_API_BASE=/api

# reCAPTCHA (Enterprise) – dev’de genelde kapalı
NEXT_PUBLIC_ENABLE_RECAPTCHA=false
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=<SITE_KEY>
NEXT_PUBLIC_RECAPTCHA_ACTION=comment_create
NEXT_PUBLIC_CAPTCHA_BYPASS_TOKEN=dev-bypass-123
```

### 3) Yerelde çalıştır

**Backend**

```bash
cd backend
bun install
npx tsc --noEmit
bun run build       # varsa
bun run dev         # http://localhost:5035
```

**Frontend**

```bash
cd ../frontend
bun install
bun run typecheck
bun run dev         # http://localhost:3000
```

---

## 🏭 Üretim (Prod) Dağıtım

> Örnekler Linux sunucu içindir. Nginx reverse proxy önerilir.

**Backend**

```bash
cd /var/www/tariftarif/backend
rm -rf dist build node_modules/.cache
bun install
npx tsc --noEmit
bun run build   # veya npm run build

pm2 start ecosystem.backend.config.cjs --name tariftarif-backend
pm2 save
```

**Frontend**

```bash
cd /var/www/tariftarif/frontend
rm -rf node_modules .next
bun install
bun run typecheck
NODE_ENV=production bun run build

pm2 start ecosystem.frontend.config.cjs --name tariftarif-frontend
pm2 save
```

**PM2 kalıcı & logrotate**

```bash
pm2 status
pm2 save
pm2 startup systemd -u <user> --hp /home/<user>   # çıktıyı uygula

pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 14
```

---

## 🧭 Mimarî (özet)

```
Tarayıcı ──> Next.js (frontend)
   │             └─ /api -> proxy -> Backend (Node)
   │                                   └─ MongoDB
   └─ reCAPTCHA Enterprise (Google) — yorum gönderiminde token kontrolü
```

* **“En Yeni Tarifler”**: `createdAt` alanına göre **yeni → eski** sıralanır.
* **“Tüm Tarifler”**: 1. sayfada, “En Yeni” kısmında listelenen ilk N kayıt **tekrar etmez**; gerekirse bir sonraki sayfadan “eksik tamamlama” yapılır.

---

## 🔐 reCAPTCHA Enterprise

* **Site Key** (frontend) ve **Server API Key** (backend) **farklıdır**.
* GCP Key’de domain listenizi (örn. `www.tarifintarifi.com`, `tarifintarifi.com`, `localhost`) eklemeyi unutmayın.
* Dev’de `NEXT_PUBLIC_ENABLE_RECAPTCHA=false` ile kapatabilirsiniz.
* Google’ın görünürlük/politika gerekliliklerine uyun (gizlilik metni, kullanım şartları).

---

## 🧪 Komut Özetleri

**Genel (typecheck + build)**

```bash
rm -rf dist
npx tsc --noEmit
bun run build
```

**Local dev**

```bash
bun run dev
```

**Temizlik (hızlı)**

```bash
rm -rf dist build node_modules/.cache
bun install
npx tsc --noEmit
npm run build
bun run dev
```

---

## 🤝 Katkıda Bulunma

1. Fork → feature branch aç (`feat/…`)
2. Anlamlı commit mesajları
3. PR açmadan önce:

   * `bun run typecheck`
   * `bun run build`
   * Gerekliyse testler
4. Açıklaması net PR’lar 🚀

Hata/öneri için **Issues** bölümünü kullanın.

---

## 🔒 Güvenlik

* **Asla** gizli anahtarları repoya koymayın.
* Prod `.env` dosyalarınızda sadece ihtiyaç duyulan değerleri bulundurun.
* CORS ve rate limit değerlerini ortamınıza göre sıkılaştırın.

---

## 📜 Lisans

MIT (varsayılan). Farklı bir lisans kullanmak isterseniz `LICENSE` dosyasını güncelleyin.

---

## 🙌 Teşekkürler

Bu projeyi kullanan ve katkı veren herkese teşekkürler. Geliştirme önerileriniz için PR/Issue açabilirsiniz.
İyi tarifler! 🧑‍🍳🍳
