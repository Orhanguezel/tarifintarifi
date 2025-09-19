// src/features/seo/BreadcrumbJsonLd.tsx
import React from "react";

export default function BreadcrumbJsonLd({
  items,
}: { items: Array<{ name: string; url: string }> }) {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://tarifintarifi.com").replace(/\/+$/,"");
  const absolutized = items.map(it => ({
    name: it.name,
    url: it.url.startsWith("http") ? it.url : `${base}${it.url.startsWith("/") ? "" : "/"}${it.url}`
  }));

  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: absolutized.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
