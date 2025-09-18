// next.config.mjs
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  output: "standalone",
  compiler: {
    styledComponents: true,
  },

  // API proxy (Backend origin ENV ile kontrol ediliyor)
  async rewrites() {
    const origin = process.env.BACKEND_ORIGIN || "http://localhost:5035";
    // Küçük bir build-time log (sadece görünürlük için)
    if (process.env.NODE_ENV !== "production") {
      console.log("[next] API proxy ->", origin);
    }
    return [{ source: "/api/:path*", destination: `${origin}/api/:path*` }];
  },

  // Yaygın görsel kaynakları (Cloudinary, kendi domain'in, lokal dev)
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "**.tarifintarifi.com" },
      { protocol: "https", hostname: "tarifintarifi.com" },
      // Dev ortamında http görsellere izin (örn. local backend)
      { protocol: "http", hostname: "localhost" },
      { protocol: "http", hostname: "127.0.0.1" },
    ],
  },

  // Cache ve güvenlik için temel header'lar
  async headers() {
    return [
      {
        // Statik derlenen dosyalar: uzun cache (immutable)
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        // Public assets
        source: "/(assets|images|fonts)/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        // HTML rotaları: no-store (SSG değilse güvenli tercih)
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Not: CSP genelde Nginx seviyesinde veya ayrı dosyada yönetilir
        ],
      },
    ];
  },

  // (İstersen) lint'i build'te fail ettirme:
  // eslint: { ignoreDuringBuilds: true },

  // (Opsiyonel) import optimizasyonu
  experimental: {
    optimizePackageImports: [
      "lodash",
      "date-fns",
      "lucide-react",
    ],
  },
};

export default withNextIntl(nextConfig);
