import React from "react";
import type { SupportedLocale } from "@/types/common";
import { absoluteUrl, compact } from "./utils";

type Props = {
  locale: SupportedLocale;
  url: string;               // sayfa URL (rel/abs)
  name: string;              // başlık
  description?: string;
  breadcrumb?: Array<{ name: string; url: string }>;
};

export default function WebPageJsonLd({ locale, url, name, description, breadcrumb }: Props) {
  const webpage = compact({
    "@context": "https://schema.org",
    "@type": "WebPage",
    name,
    url: absoluteUrl(url),
    inLanguage: locale,
    description,
  });

  const crumb =
    breadcrumb && breadcrumb.length
      ? compact({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: breadcrumb.map((it, i) =>
            compact({
              "@type": "ListItem",
              position: i + 1,
              name: it.name,
              item: absoluteUrl(it.url),
            })
          ),
        })
      : null;

  const data = crumb ? [webpage, crumb] : [webpage];

  return (
    <script
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
