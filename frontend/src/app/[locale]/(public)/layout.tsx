// src/app/[locale]/(public)/layout.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, getMessages, setRequestLocale } from "next-intl/server";

import Providers from "@/app/providers";
import Navbar from "@/layout/Navbar";
import Footer from "@/layout/Footer";
import { SUPPORTED_LOCALES, type SupportedLocale } from "@/types/common";
import IntlProviderClient from "@/i18n/IntlProviderClient";
import GAScripts from "@/features/analytics/GAScripts";
import GAView from "@/features/analytics/GAView";
import SiteJsonLd from "@/features/seo/SiteJsonLd";

export const dynamic = "force-static";
export const dynamicParams = false;

const DEFAULT_LOCALE: SupportedLocale =
  (process.env.NEXT_PUBLIC_DEFAULT_LOCALE as SupportedLocale) || "tr";

const SITE_NAME = (process.env.NEXT_PUBLIC_SITE_NAME || "tarifintarifi.com").trim();
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001").replace(/\/+$/, "");

const KNOWN_RTL = new Set(["ar", "fa", "he", "ur", "ckb", "ps", "sd", "ug", "yi", "dv"]);
const RTL_LOCALES: ReadonlySet<SupportedLocale> = new Set(
  SUPPORTED_LOCALES.filter((l) => KNOWN_RTL.has(l))
);
const isRTL = (l: SupportedLocale) => RTL_LOCALES.has(l);

const isSupported = (x: unknown): x is SupportedLocale =>
  typeof x === "string" && (SUPPORTED_LOCALES as readonly string[]).includes(x as any);

/** hreflang map — hepsini trailing slash ile üret + x-default = varsayılan dil */
function languageAlternates(defaultLocale: SupportedLocale) {
  const map: Record<string, string> = {};
  for (const loc of SUPPORTED_LOCALES) map[loc] = `/${loc}/`; // <-- slash eklendi
  map["x-default"] = `/${defaultLocale}/`;                   // <-- kök değil, varsayılan dil
  return map;
}

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

/** Next 15: params Promise döner */
type RouteParams = Promise<{ locale: string }>;

export async function generateMetadata(
  props: { params: RouteParams }
): Promise<Metadata> {
  const { locale: rawLocale } = await props.params;
  const locale = (isSupported(rawLocale) ? rawLocale : DEFAULT_LOCALE) as SupportedLocale;

  let title = SITE_NAME;
  let description = "Pratik ve güvenilir yemek tarifleri.";
  let ogAlt = SITE_NAME;

  try {
    const t = await getTranslations({ locale, namespace: "seo" });
    title = t("homeTitle", { site: SITE_NAME }) || title;
    description = t("homeDesc") || description;
    ogAlt = t("ogAlt", { site: SITE_NAME }) || ogAlt;
  } catch {}

  const ogImage = `${SITE_URL}/og.jpg`;

  // ✅ tüm URL'leri /<locale>/ formunda tut
  const PATH = `/${locale}/`;

  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: `%s • ${SITE_NAME}` },
    description,
    alternates: {
      canonical: PATH,                              // self-referencing canonical (slash’lı)
      languages: languageAlternates(DEFAULT_LOCALE) // hreflang + x-default
    },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale,
      url: PATH,
      title,
      description,
      images: ogImage ? [{ url: ogImage, width: 1200, height: 630, alt: ogAlt }] : undefined
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImage ? [ogImage] : undefined
    },
    robots: { index: true, follow: true }
  };
}

export default async function LocaleLayout(props: {
  children: React.ReactNode;
  params: RouteParams;
}) {
  const { locale: rawLocale } = await props.params;
  const current: SupportedLocale = isSupported(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  if (!isSupported(current)) notFound();

  setRequestLocale(current);

  const messages = await getMessages();

  return (
    <>
      <GAScripts />
      <Providers locale={current}>
        <IntlProviderClient locale={current} messages={messages}>
          <div dir={isRTL(current) ? "rtl" : "ltr"}>
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
