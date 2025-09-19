// next.config.mjs
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** Küçük yardımcılar */
function normalizeBase(base) {
  // "api", "/api/", "/v1" -> "/api", "/api", "/v1"
  const b = (base || "/api").trim();
  const withLead = b.startsWith("/") ? b : `/${b}`;
  return withLead.replace(/\/+$/, "");
}
function getApiBase() {
  return normalizeBase(process.env.NEXT_PUBLIC_API_BASE || "/api");
}
function getBackendOrigin() {
  const raw =
    process.env.BACKEND_ORIGIN ||
    process.env.NEXT_PUBLIC_BACKEND_ORIGIN ||
    "http://localhost:5035";
  return raw.replace(/\/+$/, ""); // tail slash temizle
}
function parseOriginForImages(origin) {
  try {
    const u = new URL(origin);
    return { protocol: u.protocol.replace(":", ""), hostname: u.hostname };
  } catch {
    // protokol yoksa http varsay
    return {
      protocol: "http",
      hostname: origin.replace(/(^\w+:|^)\/\//, "").split("/")[0],
    };
  }
}

const API_BASE = getApiBase();                 // örn: "/api"
const BACKEND_ORIGIN = getBackendOrigin();     // örn: "http://localhost:5035"
const { protocol: backendProto, hostname: backendHost } = parseOriginForImages(BACKEND_ORIGIN);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  output: "standalone",
  compiler: { styledComponents: true },

  // API proxy (ENV’e göre dinamik)
  async rewrites() {
    const destination = `${BACKEND_ORIGIN}${API_BASE}/:path*`; // -> http://localhost:5035/api/:path*
    if (process.env.NODE_ENV !== "production") {
      console.log("[next] API proxy:", `${API_BASE}/:path*`, "→", destination);
    }
    return [{ source: `${API_BASE}/:path*`, destination }];
  },

  // Görsel izinleri (Cloudinary + alan adların + backend origin)
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "**.tarifintarifi.com" },
      { protocol: "https", hostname: "tarifintarifi.com" },
      { protocol: "http", hostname: "localhost" },   // dev
      { protocol: "http", hostname: "127.0.0.1" },   // dev
      // backend origin’i de ekle (örn. http://localhost:5035)
      { protocol: backendProto, hostname: backendHost },
    ],
    // dangerouslyAllowSVG: true, // gerekirse aç
  },

  // Cache ve güvenlik + SEO (admin’e noindex)
  async headers() {
    return [
      // 1) Next static assets: uzun ve immutable
      {
        source: "/_next/static/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      // 2) Kendi assetlerin: uzun ve immutable
      {
        source: "/(assets|images|fonts)/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      // 3) Admin: arama motorlarına kapat
      {
        source: "/admin/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }],
      },
      {
        source: "/(tr|en|fr|de|it|pt|ar|ru|zh|hi)/admin/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }],
      },
      // 4) HTML sayfaları: kısa cache + güvenlik başlıkları
      {
        source: "/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, s-maxage=0, must-revalidate" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },

  experimental: {
    optimizePackageImports: ["lodash", "date-fns", "lucide-react"],
  },
};

export default withNextIntl(nextConfig);
