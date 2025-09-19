import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import RecipeDetailView from "@/features/recipes/components/detail/RecipeDetailView";
import { getRecipeBySlug } from "@/lib/recipes/api.server";
import { ALL_LOCALES } from "@/lib/recipes/constants";
import RecipeJsonLd from "@/features/seo/RecipeJsonLd"; // ⬅️ DÜZELTİLEN YOL
import BreadcrumbJsonLd from "@/features/seo/BreadcrumbJsonLd";
import type { SupportedLocale } from "@/types/common";

export const dynamic = "force-dynamic";

// Next 15: params Promise
type RouteParams = Promise<{ locale: SupportedLocale; slug: string }>;

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
    "/og-recipe-default.jpg"
  ].filter(Boolean) as string[];

  const first = candidates[0];
  return absUrl(base, first);
}

export async function generateMetadata(
  { params }: { params: RouteParams }
): Promise<Metadata> {
  const { locale, slug } = await params;

  const data = await getRecipeBySlug(locale, slug).catch(() => null);
  if (!data) return {};

  const titles = (data?.title ?? {}) as Record<string, string>;
  const descs  = (data?.description ?? {}) as Record<string, string>;

  const title = titles[locale] ?? titles.tr ?? "Tarif";
  const description = (descs[locale] ?? descs.tr ?? "").slice(0, 160);

  const canonicalSlug =
    ((data?.slug ?? {}) as Record<string, string>)[locale] ??
    data?.slugCanonical ??
    slug;

  const base =
    (process.env.NEXT_PUBLIC_SITE_URL || "https://www.tarifintarifi.com").replace(/\/+$/, "");
  const path = `/${locale}/recipes/${canonicalSlug}`;

  const ogImg = pickOgImage(data, base);

  return {
    metadataBase: new URL(base),
    title,
    description,
    alternates: {
      canonical: path,
      languages: Object.fromEntries(
        ALL_LOCALES.map((l) => {
          const s =
            ((data?.slug ?? {}) as Record<string, string>)[l] ??
            data?.slugCanonical ??
            slug;
          return [l, `/${l}/recipes/${s}`];
        })
      ),
    },
    openGraph: {
      type: "article",
      title,
      description,
      url: path,
      images: ogImg ? [{ url: ogImg, width: 1200, height: 630, alt: title }] : undefined
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImg ? [ogImg] : undefined
    }
  };
}

export default async function RecipePage(
  { params }: { params: RouteParams }
) {
  const { locale, slug } = await params;

  const data = await getRecipeBySlug(locale, slug).catch(() => null);
  if (!data) notFound();

  const base =
    (process.env.NEXT_PUBLIC_SITE_URL || "https://www.tarifintarifi.com").replace(/\/+$/, "");

  const resolvedSlug =
    (typeof (data as any).slug === "object"
      ? ((data as any).slug?.[locale] || (data as any).slug?.tr)
      : (data as any).slug) || (data as any).slugCanonical;

  const detailUrl = `${base}/${locale}/recipes/${encodeURIComponent(resolvedSlug)}`;

  // i18n breadcrumb etiketleri
  const siteName = (process.env.NEXT_PUBLIC_SITE_NAME || "tarifintarifi.com").trim();
  let homeLabel = siteName;
  try {
    const th = await getTranslations({ locale, namespace: "home" });
    homeLabel = th("title");
  } catch {/* fallback siteName */}

  let recipesLabel = "Recipes";
  try {
    const tr = await getTranslations({ locale, namespace: "recipes" });
    recipesLabel =
      ((): string => {
        try { return tr("listTitle"); } catch {}
        try { return tr("title"); } catch {}
        try { return tr("all.title"); } catch {}
        return recipesLabel;
      })();
  } catch {}

  const finalTitle =
    (data.title as any)?.[locale] || data.title?.tr || data.slugCanonical || "Recipe";

  return (
    <>
      {/* ✅ Yapılandırılmış veri */}
      <RecipeJsonLd recipe={data} locale={locale} />

      <BreadcrumbJsonLd
        items={[
          { name: homeLabel,    url: `${base}/${locale}` },
          { name: recipesLabel, url: `${base}/${locale}/recipes` },
          { name: finalTitle,   url: detailUrl },
        ]}
      />

      {/* İçerik */}
      <RecipeDetailView data={data} locale={locale} />
    </>
  );
}
