import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://ensotek.de").replace(/\/+$/, "");
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/_next/",
          "/api/",
          "/admin/",
          "/*/admin/",
          "/login/",
          "/*/login/",
          "/dashboard/",
          "/*/dashboard/",
        ],
      },
    ],
    sitemap: `${base}/api/seo/sitemap-index.xml`,
    host: base,
  };
}
