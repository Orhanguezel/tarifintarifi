import type { Translated, Recipe } from "@/lib/recipes/types";

export const tPick = (obj: Translated | undefined, locale: string) =>
  (obj?.[locale] as string) || (obj?.tr as string) || "";

export function buildJsonLd({
  data,
  locale,
  title,
  desc,
  minutes,
  servings
}: {
  data: Recipe;
  locale: string;
  title: string;
  desc: string;
  minutes?: number;
  servings?: number;
}) {
  const image0 = data.images?.[0];
  const ingredients =
    (data.ingredients || [])
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((i) => {
        const name = tPick(i.name as any, locale);
        const amt = tPick(i.amount as any, locale);
        return amt ? `${amt} ${name}` : name;
      });

  const steps =
    (data.steps || [])
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((s) => tPick(s.text as any, locale))
      .filter(Boolean);

  const jsonLd: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: title,
    description: desc,
    image: image0?.url,
    recipeCategory: data.category || "",
    recipeCuisine: (data.cuisines || []).join(", "),
    recipeYield: servings ? String(servings) : undefined,
    totalTime: minutes ? `PT${minutes}M` : undefined,
    recipeIngredient: ingredients,
    recipeInstructions: steps.map((tx) => ({ "@type": "HowToStep", text: tx }))
  };

  if (data.nutrition) {
    jsonLd.nutrition = {
      "@type": "NutritionInformation",
      calories: data.nutrition.calories ? `${data.nutrition.calories} kcal` : undefined,
      proteinContent: data.nutrition.protein ? `${data.nutrition.protein} g` : undefined,
      carbohydrateContent: data.nutrition.carbs ? `${data.nutrition.carbs} g` : undefined,
      fatContent: data.nutrition.fat ? `${data.nutrition.fat} g` : undefined,
      fiberContent: data.nutrition.fiber ? `${data.nutrition.fiber} g` : undefined,
      sodiumContent: data.nutrition.sodium ? `${data.nutrition.sodium} mg` : undefined
    };
  }
  return jsonLd;
}
