# TarifinTarifi — Kurulum & Yayına Alma Rehberi

Bu dosya; **backend** (API) ve **frontend** (Next.js) projelerini yerelde ve prod ortamında çalıştırmak için ihtiyacınız olan her şeyi içerir. Komutlar **Bun** + **PM2** akışına göre yazıldı (Node/NPM ile de çalışır).

> ⚠️ **Güvenlik:** `.env*` dosyalarınızı **asla** repoya commit etmeyin. Aşağıdaki örneklerde gerçek anahtarlar **yerine placeholder** kullanın.

---

## İçindekiler

* [Önkoşullar](#önkoşullar)
* [Dizim / Proje Yapısı](#dizim--proje-yapısı)
* [Ortam Değişkenleri (Backend & Frontend)](#ortam-değişkenleri-backend--frontend)
* [Yerel Geliştirme (Local)](#yerel-geliştirme-local)

  * [Backend (Local)](#backend-local)
  * [Frontend (Local)](#frontend-local)
* [Üretim Yayını (Prod)](#üretim-yayını-prod)

  * [Backend (Prod)](#backend-prod)
  * [Frontend (Prod)](#frontend-prod)
  * [PM2 kalıcı ayarlar & logrotate](#pm2-kalıcı-ayarlar--logrotate)
* [Temizlik / Sorun Giderme](#temizlik--sorun-giderme)
* [reCAPTCHA Enterprise Notları](#recaptcha-enterprise-notları)
* [Sık Karşılaşılan Konular](#sık-karşılaşılan-konular)

---

## Önkoşullar

* **Bun** (>= 1.1):

  ```sh
  curl -fsSL https://bun.sh/install | bash
  bun --version
  ```
* **PM2** (global):

  ```sh
  npm i -g pm2
  pm2 -v
  ```
* **MongoDB** ve erişim:
  Örnek URI: `mongodb://tarif_user:****@localhost:27017/tariftarif?authSource=tariftarif`

---

## Dizim / Proje Yapısı

```
/var/www/tariftarif
  ├─ backend/          # Express/Nest/Fastify… (API)
  └─ frontend/         # Next.js (SSR + proxy /api -> backend)
```

---

## Ortam Değişkenleri (Backend & Frontend)

Aşağıdaki örnek **prod** içindir. Local’de değerleri geliştirici makinenize göre uyarlayın.

> **Not:** Aşağıdaki anahtarlar placeholder’dır — **kendi** değerlerinizi girin.

### Backend – `.env`

```ini
# 🌍 Genel
PORT=5035
NODE_ENV=production
DEFAULT_LOCALE=tr
BASE_URL=http://localhost:5035

# 🌐 CORS / Frontend
CORS_ORIGIN=http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001,https://www.tarifintarifi.com,https://tarifintarifi.com
FRONTEND_URL=https://www.tarifintarifi.com

# 🌐 MongoDB
MONGO_URI=mongodb://tarif_user:<PASSWORD>@localhost:27019/tariftarif?authSource=tariftarif

# 🔎 Recipes arama & cache
RECIPES_USE_TEXT_SEARCH=true
RECIPES_PUBLIC_CACHE_MAX_AGE=60
RECIPES_PUBLIC_S_MAXAGE=300
RECIPES_PUBLIC_STALE_WHILE_REVALIDATE=600

# ⏱ Rate limits
RECIPES_PUBLIC_WINDOW_MS=60000
RECIPES_PUBLIC_LIST_MAX=120
RECIPES_PUBLIC_DETAIL_MAX=200
RECIPES_PUBLIC_GENERATE_MAX=10
RECIPES_PUBLIC_SEARCH_MAX=200
RECIPES_ADMIN_WINDOW_MS=60000
RECIPES_ADMIN_MAX=60

# 🤖 LLM
LLM_PROVIDER=groq
GROQ_API_KEY=<GROQ_API_KEY>
GROQ_MODEL=llama-3.3-70b-versatile
XAI_API_KEY=<XAI_API_KEY>
GROK_MODEL=grok-2-mini

# 🔐 API key’ler
RECIPES_SUBMIT_API_KEY=<SERVER_SIDE_SUBMIT_KEY>

# BACKEND — reCAPTCHA Enterprise
RECAPTCHA_ENTERPRISE_API_KEY=<GCP_SERVER_API_KEY>    # (site key değildir!)
GOOGLE_CLOUD_PROJECT_ID=<GCP_PROJECT_ID>
RECAPTCHA_EXPECTED_ACTION=comment_create
RECAPTCHA_MIN_SCORE=0.5

# (Opsiyonel) dev/test için geç
CAPTCHA_BYPASS_TOKEN=dev-bypass-123
```

### Frontend – `.env`

```ini
# 🌍 i18n & Site
NEXT_PUBLIC_SUPPORTED_LOCALES=tr,en,fr,de,it,pt,ar,ru,zh,hi
NEXT_PUBLIC_DEFAULT_LOCALE=tr
NEXT_PUBLIC_SITE_NAME=tarifintarifi.com
NEXT_PUBLIC_SITE_URL=https://www.tarifintarifi.com
NEXT_PUBLIC_CONTACT_EMAIL=support@tarifintarifi.com

# API & Proxy (Next.js)
BACKEND_ORIGIN=http://127.0.0.1:5035
NEXT_PUBLIC_BACKEND_ORIGIN=http://127.0.0.1:5035
NEXT_PUBLIC_API_BASE=/api

# reCAPTCHA (Enterprise) — FE
NEXT_PUBLIC_ENABLE_RECAPTCHA=false        # local için genelde false
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=<SITE_KEY> # Google reCAPTCHA Enterprise -> Key (platform: Website)
NEXT_PUBLIC_RECAPTCHA_ACTION=comment_create
NEXT_PUBLIC_CAPTCHA_BYPASS_TOKEN=dev-bypass-123

# (opsiyonel) public key örn. feature flag vs.
NEXT_PUBLIC_API_KEY=<PUBLIC_KEY>
```

> **Önemli:** Prod’da reCAPTCHA **true** olacak; domain listesinde `www.tarifintarifi.com`, `tarifintarifi.com`, `127.0.0.1`, `localhost` bulunmalı.

---

## Yerel Geliştirme (Local)

### Backend (Local)

```sh
cd /path/to/tariftarif/backend

# Temiz kurul (derleme öncesi tavsiye)
rm -rf dist build node_modules/.cache
bun install

# Tip kontrolü
npx tsc --noEmit

# Derleme (varsa)
bun run build

# Geliştirme sunucusu
bun run dev
# API varsayılan: http://localhost:5035
```

> Paket komutları `package.json`’a göre `bun run build` veya `npm run build` olabilir; repository’de hangisi varsa onu kullanın.

### Frontend (Local)

```sh
cd /path/to/tariftarif/frontend

rm -rf node_modules .next
bun install

# TypeScript
bun run typecheck

# Next build (gerekirse)
bun run build

# Dev
bun run dev
# Next varsayılan: http://localhost:3000 (veya 3001)
```

> Frontend, `/api` isteklerini `.env`’deki `BACKEND_ORIGIN`’e **proxy** eder. Backend ayakta olmalı.

---

## Üretim Yayını (Prod)

> Aşağıdaki örnek yollar Ubuntu için verilmiştir. Kendi dizinlerinize uyarlayın.

### Backend (Prod)

```sh
cd /var/www/tariftarif/backend

# Temizlik
rm -rf dist build node_modules/.cache
bun install

# Tip kontrolü + build
npx tsc --noEmit
npm run build   # veya bun run build

# PM2 ile ayağa kaldır / yeniden başlat
pm2 restart tariftarif-backend || true
pm2 start ecosystem.backend.config.cjs --only tariftarif-backend  # (varsa)
pm2 save
```

### Frontend (Prod)

```sh
cd /var/www/tariftarif/frontend

rm -rf node_modules .next
bun install
bun run typecheck
NODE_ENV=production bun run build

# PM2: Next server veya bun start
pm2 delete tariftarif-frontend || true
pm2 start /var/www/tariftarif/frontend/ecosystem.frontend.config.cjs
pm2 save

# Alternatif doğrudan komutla:
bun run analyze  # (opsiyonel bundle analizi)
which bun        # ör: /usr/bin/bun

PORT=3012 NODE_ENV=production \
pm2 start "$(which bun)" --name tarifintarifi-frontend -- run start

pm2 save
```

> Frontend prod’da bir reverse proxy (nginx) arkasında çalıştırılabilir. `PORT` ve upstream ayarlarını proxy tarafında eşleştirin.

### PM2 kalıcı ayarlar & logrotate

```sh
pm2 status
pm2 save
pm2 startup systemd -u root --hp /root
# Yukarıdaki çıktıda verdiği komutu da çalıştırın

# Log rotate önerilir:
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 14
```

---

## Temizlik / Sorun Giderme

**Hızlı temizlik (dev):**

```sh
rm -rf dist build node_modules/.cache
bun install
npx tsc --noEmit
npm run build
bun run dev
```

**Hızlı temizlik (prod):**

```sh
rm -rf dist build node_modules/.cache
bun install
npx tsc --noEmit
npm run build
pm2 restart tariftarif-backend
pm2 save
```

**Frontend local temiz kurulum:**

```sh
rm -rf node_modules .next
bun install
bun run typecheck
bun run build
bun run dev
```

**Frontend prod hızlı reset:**

```sh
cd /var/www/tariftarif/frontend
rm -rf node_modules .next
bun install
bun run typecheck
NODE_ENV=production bun run build
pm2 restart tariftarif-frontend
pm2 save
```

---

## reCAPTCHA Enterprise Notları

* **Site Key** (FE) ve **Server API Key** (BE) farklıdır:

  * FE: `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` (domain kısıtlı).
  * BE: `RECAPTCHA_ENTERPRISE_API_KEY` (GCP API anahtarı).
* **Domain listesi**: konsolda `www.tarifintarifi.com`, `tarifintarifi.com`, `127.0.0.1`, `localhost` ekli olmalı.
* **Dil**: Frontend, sayfa yereline göre `hl=<locale>` ile script’i yükler.
* **Bypass**:

  * FE: `NEXT_PUBLIC_ENABLE_RECAPTCHA=false` ile dev’de kapatabilirsiniz.
  * BE: `CAPTCHA_BYPASS_TOKEN` (sadece dev!) gönderirseniz doğrulamayı atlar.
* **Action**: FE ve BE’de `comment_create` ile **aynı** olmalı.

---

## Sık Karşılaşılan Konular

* **CORS 400/401**: `CORS_ORIGIN`’de FE domain(ler)i eksik olabilir.
* **/api proxy sorunları**: Frontend’in `.env`’indeki `BACKEND_ORIGIN` ve `NEXT_PUBLIC_API_BASE=/api` değerlerini kontrol edin.
* **“En Yeni Tarifler”**:

  * FE `HomeView` bileşeni, **createdAt** alanına göre yeni→eski sıralar.
  * “Tüm Tarifler” 1. sayfada, “En Yeni”deki ilk 5’i **tekrar etmez**; sayfalamayı bozmadan bir sonraki sayfadan doldurur.
* **reCAPTCHA rozeti** çok yer kaplıyorsa:

  * Rozet CSS ile küçültülür (projeye dahil). Tam gizlemek isterseniz Google’ın yasal notlarını sayfada **göstermek zorundasınız**.

---

Herhangi bir yerde takılırsanız “hata mesajı + çıktılar + kullandığınız komutlar” ile birlikte bilgi verin; birlikte hızlıca çözeriz. 🚀
