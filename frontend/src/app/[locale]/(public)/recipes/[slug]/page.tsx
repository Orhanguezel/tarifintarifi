// src/app/[locale]/(public)/recipes/[slug]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import RecipeDetailView from "@/features/recipes/components/detail/RecipeDetailView";
import { getRecipeBySlug } from "@/lib/recipes/api.server";
import RecipeJsonLd from "@/features/seo/RecipeJsonLd";
import BreadcrumbJsonLd from "@/features/seo/BreadcrumbJsonLd";
import {
  SUPPORTED_LOCALES,
  type SupportedLocale,
  getMultiLang,
} from "@/types/common";
import { DEFAULT_LOCALE } from "@/i18n/locale-helpers";

export const dynamic = "force-dynamic";

// ✅ Daha güvenli: Next paramları string döner
type RouteParams = Promise<{ locale: string; slug: string }>;

function absUrl(base: string, p?: string): string | undefined {
  if (!p) return undefined;
  if (/^https?:\/\//i.test(p)) return p;
  return `${base.replace(/\/+$/, "")}/${String(p).replace(/^\/+/, "")}`;
}

function pickOgImage(data: any, base: string): string | undefined {
  const candidates = [
    data?.image,
    data?.cover,
    data?.coverUrl,
    data?.thumbnail,
    data?.hero,
    data?.mainImage?.url,
    data?.images?.[0]?.url,
    data?.images?.[0]?.webp,
    data?.images?.[0]?.thumbnail,
    process.env.NEXT_PUBLIC_OG_IMAGE,
    "/og-recipe-default.jpg",
  ].filter(Boolean) as string[];
  return absUrl(base, candidates[0]);
}

// küçük yardımcı
const isSupported = (x: string): x is SupportedLocale =>
  (SUPPORTED_LOCALES as readonly string[]).includes(x as any);

export async function generateMetadata(
  { params }: { params: RouteParams }
): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale = isSupported(rawLocale) ? (rawLocale as SupportedLocale) : DEFAULT_LOCALE;

  const data = await getRecipeBySlug(locale, slug).catch(() => null);
  if (!data) return {};

  const titleStr = getMultiLang(data.title as any, locale) || "Tarif";
  const descStr  = (getMultiLang(data.description as any, locale) || "").slice(0, 160);

  const slugForLocale =
    (typeof (data as any).slug === "object"
      ? (data as any).slug?.[locale]
      : (data as any).slug) ||
    (data as any).slugCanonical ||
    slug;

  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.tarifintarifi.com").replace(/\/+$/, "");
  // ✅ encode
  const path = `/${locale}/recipes/${encodeURIComponent(String(slugForLocale))}`;
  const ogImg = pickOgImage(data, base);

  // ✅ hreflang + encode + x-default
  const languages: Record<string, string> = {};
  for (const l of SUPPORTED_LOCALES) {
    const s =
      (typeof (data as any).slug === "object"
        ? (data as any).slug?.[l]
        : (data as any).slug) ||
      (data as any).slugCanonical ||
      slug;
    languages[l] = `/${l}/recipes/${encodeURIComponent(String(s))}`;
  }
  languages["x-default"] = `/${DEFAULT_LOCALE}/recipes/${encodeURIComponent(
    String(
      (typeof (data as any).slug === "object"
        ? (data as any).slug?.[DEFAULT_LOCALE]
        : (data as any).slug) || (data as any).slugCanonical || slug
    )
  )}`;

  return {
    metadataBase: new URL(base),
    title: titleStr,
    description: descStr,
    alternates: {
      canonical: path,
      languages,
    },
    openGraph: {
      type: "article",
      title: titleStr,
      description: descStr,
      url: path,
      images: ogImg ? [{ url: ogImg, width: 1200, height: 630, alt: titleStr }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: titleStr,
      description: descStr,
      images: ogImg ? [ogImg] : undefined,
    },
    robots: { index: true, follow: true }
  };
}

export default async function RecipePage(
  { params }: { params: RouteParams }
) {
  const { locale: rawLocale, slug } = await params;
  const locale = isSupported(rawLocale) ? (rawLocale as SupportedLocale) : DEFAULT_LOCALE;

  const data = await getRecipeBySlug(locale, slug).catch(() => null);
  if (!data) notFound();

  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.tarifintarifi.com").replace(/\/+$/, "");

  const resolvedSlug =
    (typeof (data as any).slug === "object"
      ? ((data as any).slug?.[locale] || (data as any).slug?.tr)
      : (data as any).slug) || (data as any).slugCanonical;

  // ✅ encode
  const detailUrl = `${base}/${locale}/recipes/${encodeURIComponent(String(resolvedSlug))}`;

  const siteName = (process.env.NEXT_PUBLIC_SITE_NAME || "tarifintarifi.com").trim();
  let homeLabel = siteName;
  try {
    const th = await getTranslations({ locale, namespace: "home" });
    homeLabel = th("title");
  } catch {}

  let recipesLabel = "Recipes";
  try {
    const tr = await getTranslations({ locale, namespace: "recipes" });
    try { recipesLabel = tr("listTitle"); } catch {}
    try { recipesLabel = recipesLabel === "Recipes" ? tr("title") : recipesLabel; } catch {}
    try { recipesLabel = recipesLabel === "Recipes" ? tr("all.title") : recipesLabel; } catch {}
  } catch {}

  const finalTitle = getMultiLang(data.title as any, locale) || data.slugCanonical || "Recipe";

  return (
    <>
      <RecipeJsonLd recipe={data} locale={locale} />
      <BreadcrumbJsonLd
        items={[
          { name: homeLabel,    url: `/${locale}` },
          { name: recipesLabel, url: `/${locale}/recipes` },
          { name: finalTitle,   url: detailUrl },
        ]}
      />
      <RecipeDetailView data={data} locale={locale} />
    </>
  );
}
