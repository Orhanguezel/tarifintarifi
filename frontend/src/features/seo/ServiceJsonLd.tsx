import React from "react";
import { absoluteUrl, compact } from "./utils";

type Props = {
  name: string;
  description?: string;
  areaServed?: string[];     // ["DE","TR"] veya ["Germany"]
  serviceType?: string;      // "Fire Protection Systems"
  providerName?: string;     // Ensotek
  url?: string;
  images?: string[];
};

export default function ServiceJsonLd({
  name,
  description,
  areaServed = [],
  serviceType,
  providerName,
  url,
  images = [],
}: Props) {
  const data = compact({
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    description,
    serviceType,
    areaServed: areaServed.length ? areaServed : undefined,
    provider: providerName ? compact({ "@type": "Organization", name: providerName }) : undefined,
    image: images.map(absoluteUrl),
    url: url ? absoluteUrl(url) : undefined,
  });

  return (
    <script
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
