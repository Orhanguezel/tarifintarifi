// app/[locale]/recipes/[slug]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import RecipeDetailView from "@/features/recipes/components/detail/RecipeDetailView";
import { getRecipeBySlug } from "@/lib/recipes/api.server";
import { ALL_LOCALES } from "@/lib/recipes/constants";

// export const revalidate = RECIPE_REVALIDATE_SECONDS; // ❌ KALDIR
export const dynamic = "force-dynamic";

// Next 15: params Promise
type RouteParams = Promise<{ locale: string; slug: string }>;

export async function generateMetadata(
  { params }: { params: RouteParams }
): Promise<Metadata> {
  const { locale, slug } = await params;

  const data = await getRecipeBySlug(locale, slug).catch(() => null);
  const titles = (data?.title ?? {}) as Record<string, string>;
  const descs  = (data?.description ?? {}) as Record<string, string>;

  const title = titles[locale] ?? titles.tr ?? "Tarif";
  const description = descs[locale] ?? descs.tr ?? "";
  const canonicalSlug =
    ((data?.slug ?? {}) as Record<string, string>)[locale] ??
    data?.slugCanonical ??
    slug;

  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/recipes/${canonicalSlug}`,
      languages: Object.fromEntries(
        ALL_LOCALES.map((l) => [
          l,
          `/${l}/recipes/${((data?.slug ?? {}) as Record<string, string>)[l] ?? data?.slugCanonical ?? slug}`,
        ])
      ),
    },
    openGraph: {
      title,
      description,
      url: `/${locale}/recipes/${canonicalSlug}`,
    },
  };
}

export default async function RecipePage(
  { params }: { params: RouteParams }
) {
  const { locale, slug } = await params;

  const data = await getRecipeBySlug(locale, slug).catch(() => null);
  if (!data) notFound();

  return <RecipeDetailView data={data} locale={locale} />;
}
