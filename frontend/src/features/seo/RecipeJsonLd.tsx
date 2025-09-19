import React from "react";
import type { Recipe } from "@/lib/recipes/types";
import type { SupportedLocale } from "@/types/common";

type Props = { recipe: Recipe; locale: SupportedLocale };

export default function RecipeJsonLd({ recipe, locale }: Props) {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://tarifintarifi.com").replace(/\/+$/,"");
  const slug =
    (typeof recipe.slug === "object"
      ? (recipe.slug?.[locale] || recipe.slug?.tr)
      : (recipe.slug as any)) || recipe.slugCanonical;

  const url  = `${base}/${locale}/recipes/${encodeURIComponent(slug)}`;
  const img  = recipe.images?.[0]?.url;

  const steps = (recipe.steps || []).map((s, i) => ({
    "@type": "HowToStep",
    position: i + 1,
    text: s.text
  }));

  const name =
    recipe.title?.[locale] ||
    recipe.title?.tr ||
    recipe.slugCanonical;

  const description =
    (typeof recipe.description === "object"
      ? (recipe.description as any)?.[locale] || (recipe as any).description?.tr
      : (recipe as any).description) || undefined;

  const data: any = {
    "@context": "https://schema.org",
    "@type": "Recipe",
    "@id": `${url}#recipe`,
    "url": url,
    "name": name,
    "description": description,
    "image": img ? [img] : undefined,                     // 1200px+ önerilir
    "datePublished": recipe.createdAt || undefined,
    "dateModified": recipe.updatedAt || recipe.createdAt || undefined,
    "recipeCuisine": recipe.cuisines?.[0],
    "recipeCategory": recipe.category || undefined,
    "keywords": (recipe.tags || []).join(", "),
    "recipeYield": recipe.servings ? String(recipe.servings) : undefined,
    "totalTime": recipe.totalMinutes ? `PT${recipe.totalMinutes}M` : undefined,
    "prepTime": recipe.prepMinutes ? `PT${recipe.prepMinutes}M` : undefined,
    "cookTime": recipe.cookMinutes ? `PT${recipe.cookMinutes}M` : undefined,
    "nutrition": recipe.nutrition?.calories
      ? { "@type": "NutritionInformation", calories: `${recipe.nutrition.calories} calories` }
      : undefined,
    "recipeIngredient": (recipe.ingredients || [])
      .map(i => `${i.amount ?? ""} ${i.name}`.trim())
      .filter(Boolean),
    "recipeInstructions": steps.length ? steps : undefined,
  };

  if (recipe.ratingAvg && recipe.commentCount) {
    data.aggregateRating = {
      "@type": "AggregateRating",
      "ratingValue": Number(recipe.ratingAvg).toFixed(1),
      "reviewCount": recipe.commentCount
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
