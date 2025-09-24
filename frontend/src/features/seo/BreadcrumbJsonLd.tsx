import React from "react";
import { absoluteUrl, compact } from "./utils";

export default function BreadcrumbJsonLd({
  items,
}: { items: Array<{ name: string; url: string }> }) {
  const absolutized = items.map((it) => ({
    name: it.name,
    url: absoluteUrl(it.url),
  }));

  const data = compact({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: absolutized.map((it, i) =>
      compact({
        "@type": "ListItem",
        position: i + 1,
        name: it.name,
        item: it.url,
      })
    ),
  });

  return (
    <script
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
