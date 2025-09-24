// src/features/page/seo.ts
import type { Metadata } from "next";
import { SITE_NAME, SITE_URL, languageAlternates, DEFAULT_LOCALE } from "@/i18n/locale-helpers";
import type { SupportedLocale } from "@/types/common";

export function basicMeta({
  locale,
  path,
  title,
  description,
  image = `${SITE_URL}/og.jpg`,
}: {
  locale: SupportedLocale;
  path: string;              // "/tr/about" gibi absolute path (locale prefiksli)
  title: string;
  description: string;
  image?: string;
}): Metadata {
  const url = new URL(path.replace(/^\//, "/"), SITE_URL).toString();
  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    alternates: {
      canonical: url,
      languages: languageAlternates(DEFAULT_LOCALE)
    },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale,
      url,
      title,
      description,
      images: [{ url: image, width: 1200, height: 630, alt: SITE_NAME }]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image]
    },
    robots: { index: true, follow: true }
  };
}
