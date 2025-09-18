// next.config.mjs
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compiler: { styledComponents: true },

  // API proxy (Backend origin ENV ile kontrol ediliyor)
  async rewrites() {
    const origin = process.env.BACKEND_ORIGIN || "http://localhost:5035";
    return [{ source: "/api/:path*", destination: `${origin}/api/:path*` }];
  },

  // Görseller için yaygın bir pattern (Cloudinary vs.) — istersen tut
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "**.tarifintarifi.com" },
    ],
  },

  // İstersen build’te lint hatalarını geçici kapat:
  // eslint: { ignoreDuringBuilds: false },
};

export default withNextIntl(nextConfig);
