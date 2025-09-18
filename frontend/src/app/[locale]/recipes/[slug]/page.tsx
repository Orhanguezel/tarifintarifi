// app/[locale]/recipes/[slug]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import RecipeDetailView from "@/features/recipes/components/detail/RecipeDetailView";
import { getRecipeBySlug } from "@/lib/recipes/api.server";
import { ALL_LOCALES } from "@/lib/recipes/constants";
import RecipeJsonLd from "@/features/recipes/RecipeJsonLd";
import BreadcrumbJsonLd from "@/features/seo/BreadcrumbJsonLd";

export const dynamic = "force-dynamic";

// Next 15: params Promise
type RouteParams = Promise<{ locale: string; slug: string }>;

function absUrl(base: string, p?: string): string | undefined {
  if (!p) return undefined;
  if (/^https?:\/\//i.test(p)) return p;
  return `${base.replace(/\/+$/, "")}/${String(p).replace(/^\/+/, "")}`;
}

function pickOgImage(data: any, base: string): string | undefined {
  const candidates = [
    // Tekil alan isimleri (projene uyarsa kullanılır)
    data?.image,
    data?.cover,
    data?.coverUrl,
    data?.thumbnail,
    data?.hero,
    data?.mainImage?.url,
    // Koleksiyon alanları
    data?.images?.[0]?.url,
    data?.images?.[0]?.webp,
    data?.images?.[0]?.thumbnail,
    // Ortam değişkeni (site-wide)
    process.env.NEXT_PUBLIC_OG_IMAGE,
    // Public fallback (public/og-recipe-default.jpg ekleyin)
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
  const description = descs[locale] ?? descs.tr ?? "";

  const canonicalSlug =
    ((data?.slug ?? {}) as Record<string, string>)[locale] ??
    data?.slugCanonical ??
    slug;

  const base =
    (process.env.NEXT_PUBLIC_SITE_URL || "https://www.tarifintarifi.com").replace(/\/+$/, "");
  const path = `/${locale}/recipes/${canonicalSlug}`;

  // ✅ Görsel: tariften → env → public fallback
  const ogImg = pickOgImage(data, base);

  return {
    title,
    description,
    alternates: {
      canonical: `${base}${path}`,
      languages: Object.fromEntries(
        ALL_LOCALES.map((l) => {
          const s =
            ((data?.slug ?? {}) as Record<string, string>)[l] ??
            data?.slugCanonical ??
            slug;
          return [l, `${base}/${l}/recipes/${s}`];
        })
      ),
    },
    openGraph: {
      title,
      description,
      url: `${base}${path}`,
      images: ogImg ? [{ url: ogImg, width: 1200, height: 630, alt: title }] : undefined,
      type: "article",
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

  // --- i18n breadcrumb etiketleri (home.json + recipes.json) ---
  const siteName = (process.env.NEXT_PUBLIC_SITE_NAME || "tarifintarifi.com").trim();
  let homeLabel = siteName;

  let recipesLabel = "Recipes";
  try {
    const tr = await getTranslations({ locale, namespace: "recipes" });
    recipesLabel =
      ((): string => {
        try { return tr("listTitle"); } catch {}
        try { return tr("title"); } catch {}
        try { return tr("all.title"); } catch {}
        return recipesLabel; // fallback
      })();
  } catch {}

  const finalTitle =
    (data.title as any)?.[locale] || data.title?.tr || data.slugCanonical || "Recipe";

  return (
    <>
      {/* JSON-LD şemaları */}
      <RecipeJsonLd r={data} locale={locale} />
      <BreadcrumbJsonLd
        items={[
          { name: homeLabel,    url: `${base}/${locale}` },
          { name: recipesLabel, url: `${base}/${locale}/recipes` },
          { name: finalTitle,   url: detailUrl },
        ]}
      />

      {/* Görsel içerik */}
      <RecipeDetailView data={data} locale={locale} />
    </>
  );
}
