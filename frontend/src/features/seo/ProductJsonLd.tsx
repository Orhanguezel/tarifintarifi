import React from "react";
import type { SupportedLocale } from "@/types/common";
import { absoluteUrl, compact } from "./utils";

type Offer = {
  price?: number | string;
  priceCurrency?: string;        // EUR, USD...
  availability?: string;         // https://schema.org/InStock
  url?: string;
};

type AggregateRating = { ratingValue: number; reviewCount: number };

type Props = {
  locale: SupportedLocale;
  url: string;                   // ürün URL (rel/abs)
  name: string;
  description?: string;
  images?: string[];
  sku?: string;
  brand?: string;
  mpn?: string;
  gtin13?: string;
  offers?: Offer;
  aggregateRating?: AggregateRating;
};

export default function ProductJsonLd({
  locale,
  url,
  name,
  description,
  images = [],
  sku,
  brand,
  mpn,
  gtin13,
  offers,
  aggregateRating,
}: Props) {
  const data = compact({
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    image: images.map(absoluteUrl),
    sku,
    mpn,
    gtin13,
    brand: brand ? compact({ "@type": "Brand", name: brand }) : undefined,
    offers: offers
      ? compact({
          "@type": "Offer",
          url: absoluteUrl(offers.url || url),
          price: offers.price,
          priceCurrency: offers.priceCurrency || "EUR",
          availability: offers.availability || "https://schema.org/InStock",
        })
      : undefined,
    aggregateRating: aggregateRating
      ? compact({
          "@type": "AggregateRating",
          ratingValue: aggregateRating.ratingValue,
          reviewCount: aggregateRating.reviewCount,
        })
      : undefined,
  });

  return (
    <script
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
