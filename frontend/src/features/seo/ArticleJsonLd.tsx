import React from "react";
import type { SupportedLocale } from "@/types/common";
import { absoluteUrl, compact } from "./utils";

type ArticleKind = "Article" | "NewsArticle" | "BlogPosting";

type Props = {
  kind?: ArticleKind;               // default: Article
  locale: SupportedLocale;
  url: string;                      // relative veya absolute
  title: string;
  description?: string;
  images?: string[];                // kapak/görseller
  authorName?: string;
  publisherName?: string;
  datePublished?: string | Date;
  dateModified?: string | Date;
};

export default function ArticleJsonLd({
  kind = "Article",
  locale,
  url,
  title,
  description,
  images = [],
  authorName,
  publisherName,
  datePublished,
  dateModified,
}: Props) {
  const data = compact({
    "@context": "https://schema.org",
    "@type": kind,
    mainEntityOfPage: absoluteUrl(url),
    headline: title,
    inLanguage: locale,
    description,
    image: images.map(absoluteUrl),
    author: authorName ? compact({ "@type": "Person", name: authorName }) : undefined,
    publisher: publisherName
      ? compact({
          "@type": "Organization",
          name: publisherName,
          logo: compact({ "@type": "ImageObject", url: absoluteUrl("/logo.png") }),
        })
      : undefined,
    datePublished,
    dateModified: dateModified || datePublished,
  });

  return (
    <script
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
