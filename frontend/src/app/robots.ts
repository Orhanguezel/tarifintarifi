// app/robots.ts
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://tarifintarifi.com").replace(/\/+$/, "");
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/_next/", "/api/"], // ← iç yolları tarama
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
