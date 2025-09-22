import type { Metadata } from "next";
import type { Recipe } from "@/lib/recipes/types";
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

export const revalidate = 60;

// Next 15: params Promise
type RouteParams = Promise<{ locale: string }>;

export async function generateMetadata(
  { params }: { params: RouteParams }
): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale: SupportedLocale = isSupportedLocale(raw) ? raw : DEFAULT_LOCALE;

  // çeviri ile başlık + açıklama
  let title = SITE_NAME;
  let description = "Pratik ve güvenilir yemek tarifleri.";
  try {
    const t = await getTranslations({ locale, namespace: "seo" });
    title = t("homeTitle", { site: SITE_NAME }) || title;
    description = t("homeDesc") || description;
  } catch {}

  const PATH = `/${locale}/`;
  const ogImage = `${SITE_URL}/og.jpg`;

  return {
    metadataBase: new URL(SITE_URL),
    title,                               // ← sayfa başlığı
    description,                         // ← snippet
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

  const page = Math.max(1, parseInt(String(sp.page ?? "1"), 10) || 1);
  const limit = 12;
  const loc: SupportedLocale = isSupportedLocale(locale) ? locale : DEFAULT_LOCALE;

  const origin = (process.env.BACKEND_ORIGIN || "http://localhost:5034").replace(/\/$/, "");
  let items: Recipe[] = [];

  try {
    const res = await fetch(`${origin}/api/recipes?limit=${limit}&page=${page}`, {
      headers: { "Accept-Language": loc, "x-lang": loc },
      next: { revalidate }
    });
    if (res.ok) {
      const j = await res.json();
      items = Array.isArray(j?.data) ? j.data : [];
    } else {
      console.warn(`[home] fetch not ok: ${res.status}`);
    }
  } catch (e: any) {
    console.warn(`[home] fetch failed during build/ISR: ${e?.message || e}`);
  }

  return <HomeView items={items} locale={loc} />;
}
