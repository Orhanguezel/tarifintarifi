// app/[locale]/(public)/page.tsx

import type { Metadata } from "next";
import HomeView from "./(home)/HomeView";
import { type SupportedLocale } from "@/types/common";
import { getTranslations } from "next-intl/server";
import {
  DEFAULT_LOCALE,
  isSupportedLocale,
  SITE_NAME,
  SITE_URL,
  languageAlternates
} from "@/i18n/locale-helpers";
import SeoCookieSnapshot from "@/features/seo/SeoCookieSnapshot";


export const revalidate = 60;

// Next 15: params Promise
type RouteParams = Promise<{ locale: string }>;

export async function generateMetadata(
  { params }: { params: RouteParams }
): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale: SupportedLocale = isSupportedLocale(raw) ? raw : DEFAULT_LOCALE;

  let title = SITE_NAME;
  let description = "Ensotek – endüstriyel çözümler ve teknik hizmetler.";
  try {
    const t = await getTranslations({ locale, namespace: "seo" });
    title = t("homeTitle", { site: SITE_NAME }) || title;
    description = t("homeDesc") || description;
  } catch {}

  const PATH = `/${locale}/`;
  const ogImage = `${SITE_URL}/og.webp`; 

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    alternates: {
      canonical: PATH,
      languages: languageAlternates(DEFAULT_LOCALE)
    },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale,
      url: PATH,
      title,
      description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: SITE_NAME }]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage]
    },
    robots: { index: true, follow: true }
  };
}

export default async function Home(props: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await props.params;
  const sp = await props.searchParams;

  // İleride pagination gerekirse hazır dursun:
  const page = Math.max(1, parseInt(String(sp.page ?? "1"), 10) || 1);
  void page;

  const loc: SupportedLocale = isSupportedLocale(locale) ? locale : DEFAULT_LOCALE;

  // Backend endpoint hazır olduğunda buraya fetch eklenebilir (RTK Query veya RSC fetch).
   <SeoCookieSnapshot tenant="ensotek" pageKey="home" locale={loc} />
  return <HomeView locale={loc} />;
}
