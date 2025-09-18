// src/features/seo/BreadcrumbJsonLd.tsx
import React from "react";

export default function BreadcrumbJsonLd({
  items,
}: {
  items: Array<{ name: string; url: string }>;
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
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
