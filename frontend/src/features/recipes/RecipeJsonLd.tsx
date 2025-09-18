// src/features/recipes/RecipeJsonLd.tsx
import React from "react";
import type { Recipe } from "@/lib/recipes/types";

function abs(base: string, p?: string) {
  if (!p) return base;
  if (/^https?:\/\//i.test(p)) return p;
  return `${base.replace(/\/+$/,"")}/${p.replace(/^\/+/,"")}`;
}

export default function RecipeJsonLd({ r, locale }: { r: Recipe; locale: string }) {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.tarifintarifi.com").replace(/\/+$/,"");

  const slug =
    (typeof (r as any).slug === "object"
      ? ((r as any).slug?.[locale] || (r as any).slug?.tr)
      : (r as any).slug) || (r as any).slugCanonical;

  const url = abs(base, `${locale}/recipes/${encodeURIComponent(slug)}`);
  const title = (r.title as any)?.[locale] || r.title?.tr || r.slugCanonical || "Tarif";
  const img = r.images?.[0]?.url || r.images?.[0]?.webp || r.images?.[0]?.thumbnail;

  const steps = (r.steps || (r as any).instructions || []).map((s: any, i: number) => {
    const name = s?.title || s?.name || `Adım ${i + 1}`;
    const text = s?.text || s?.description || String(s || "");
    const image = s?.image || img;
    const stepUrl = `${url}#step-${i + 1}`;
    return { "@type": "HowToStep", name, text, url: stepUrl, image };
  });

  const cuisine =
    (Array.isArray((r as any).cuisines) && (r as any).cuisines[0]) ||
    (r.tags || []).find((t) => /mutfağı|cuisine/i.test(String(t))) ||
    "International";

  const keywords = (r.tags || []).join(", ");
  const ratingCount = Number(r.ratingCount || 0);
  const ratingValue = Number(r.ratingAvg || 0) || undefined;

  const data: any = {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: title,
    description: (r as any).description?.[locale] || (r as any).description?.tr || title,
    image: img ? [img] : undefined,
    url,
    datePublished: (r as any).createdAt || (r as any).updatedAt || new Date().toISOString(),
    recipeCuisine: String(cuisine),
    keywords,
    author: { "@type": "Person", name: (r as any).authorName || "TarifinTarifi Kullanıcısı" },
    totalTime: r.totalMinutes ? `PT${Math.max(1, Number(r.totalMinutes))}M` : undefined,
    recipeYield: r.servings ? `${r.servings} porsiyon` : undefined,
    nutrition: {
      "@type": "NutritionInformation",
      calories:
        (r as any)?.calories || r.nutrition?.calories
          ? `${(r as any)?.calories || r.nutrition?.calories} kcal`
          : undefined,
    },
    recipeIngredient: (r.ingredients || []).map((x: any) => x.text || x),
    recipeInstructions: steps,
  };

  if (ratingCount > 0 && ratingValue) {
    data.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: ratingValue.toFixed(1),
      ratingCount,
    };
  }

  return (
    <script
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
