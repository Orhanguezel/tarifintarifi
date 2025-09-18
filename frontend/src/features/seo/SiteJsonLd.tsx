// src/features/seo/SiteJsonLd.tsx
import React from "react";
import type { SupportedLocale } from "@/types/common";

export default function SiteJsonLd({ locale }: { locale: SupportedLocale }) {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://tarifintarifi.com").replace(/\/+$/,"");
  const name = (process.env.NEXT_PUBLIC_SITE_NAME || "tarifintarifi.com").trim();
  const logo = `${base}/logo.png`;

  const data = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${base}#website`,
      "url": `${base}/`,
      "name": name,
      "inLanguage": locale,
      "potentialAction": {
        "@type": "SearchAction",
        "target": `${base}/${locale}?q={search_term_string}`,
        "query-input": "required name=search_term_string"
      }
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": `${base}#organization`,
      "url": `${base}/`,
      "name": name,
      "logo": {
        "@type": "ImageObject",
        "url": logo
      }
      // "sameAs": ["https://instagram.com/...","https://www.youtube.com/@..."]
    }
  ];

  return (
    <script
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
