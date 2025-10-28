// src/app/[locale]/(public)/layout.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMessages, setRequestLocale } from "next-intl/server";

import Providers from "@/app/providers";
import Navbar from "@/layout/Navbar";
import Footer from "@/layout/Footer";
import IntlProviderClient from "@/i18n/IntlProviderClient";
import GAScripts from "@/features/analytics/GAScripts";
import GAView from "@/features/analytics/GAView";
import SiteJsonLd from "@/features/seo/SiteJsonLd";
import HtmlLangSync from "@/i18n/HtmlLangSync";

import {
  SUPPORTED_LOCALES,
  type SupportedLocale
} from "@/types/common";
import {
  DEFAULT_LOCALE,
  SITE_NAME,
  SITE_URL,
  isSupportedLocale,
  isRTL,
  languageAlternates
} from "@/i18n/locale-helpers";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

/** Next 15: params Promise döner */
type RouteParams = Promise<{ locale: string }>;

export async function generateMetadata(
  props: { params: RouteParams }
): Promise<Metadata> {
  const { locale: rawLocale } = await props.params;
  const locale = (isSupportedLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE) as SupportedLocale;

  const PATH = `/${locale}/`;
  const ogImage = `${SITE_URL}/og.jpg`;

  return {
    metadataBase: new URL(SITE_URL),
    // Yalnızca şablon + nötr default; sayfalar kendi title’ını verir.
    title: {
      template: `%s • ${SITE_NAME}`,
      default: SITE_NAME
    },
    alternates: {
      canonical: PATH,
      languages: languageAlternates(DEFAULT_LOCALE)
    },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale,
      url: PATH,
      images: [{ url: ogImage, width: 1200, height: 630, alt: SITE_NAME }]
    },
    twitter: { card: "summary_large_image" },
    robots: { index: true, follow: true }
  };
}

export default async function LocaleLayout(props: {
  children: React.ReactNode;
  params: RouteParams;
}) {
  const { locale: rawLocale } = await props.params;
  const current: SupportedLocale = isSupportedLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  if (!isSupportedLocale(current)) notFound();

  // next-intl bağlamı
  setRequestLocale(current);
  const messages = await getMessages();

  const dir = isRTL(current) ? "rtl" : "ltr";

  return (
    <>
      <GAScripts />
      <Providers locale={current}>
        <IntlProviderClient locale={current} messages={messages}>
          {/* İç sarmal <div>’de de dir veriyoruz; ayrıca lang/dir’i client’ta senkronluyoruz */}
          <div dir={dir}>
            <HtmlLangSync lang={current} dir={dir} />
            <SiteJsonLd locale={current} />
            <GAView locale={current} />
            <Navbar locale={current} showSearch />
            {props.children}
            <Footer locale={current} />
          </div>
        </IntlProviderClient>
      </Providers>
    </>
  );
}
