// src/hooks/useTopRecipeCategories.ts
"use client";

import { useMemo } from "react";
import { useListRecipesQuery } from "@/lib/recipes/api.client";
import type { SupportedLocale } from "@/types/common";
import type { Recipe } from "@/lib/recipes/types";
import { normalizeCategoryKey } from "@/lib/recipes/categories";
import { AI_CATEGORY_KEYS } from "@/lib/recipes/categories";

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(n, max));

export function useTopRecipeCategories(
  locale: SupportedLocale,
  sampleSize = 120,
  topN = 5
) {
  const limit = clamp(Number(sampleSize) || 120, 1, 120);

  // BOŞLUKLA ayrılmış alan isimleri
  const {
    data: recipes = [],
    isFetching,
    isLoading,
    isError,
  } = useListRecipesQuery(
    {
      locale,
      limit,
      fields: "category, categoryKey, categorySlug",
    },
    {
      // Görsel “kaçma”yı azaltmak için mount’ta tekrar fetch etme
      refetchOnFocus: false,
      refetchOnReconnect: false,
      refetchOnMountOrArgChange: false,
    }
  );

  const top = useMemo(() => {
    const counts: Record<string, number> = {};

    for (const r of recipes as Array<
      Pick<Recipe, "category"> & Partial<{ categoryKey: string; categorySlug: string }>
    >) {
      const raw = (r as any)?.category ?? (r as any)?.categoryKey ?? (r as any)?.categorySlug ?? null;
      const key = normalizeCategoryKey(raw);
      if (!key) continue;
      counts[key] = (counts[key] ?? 0) + 1;
    }

    const ranked = Object.entries(counts)
      .filter(([, c]) => c > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(([key, count]) => ({ key, count }));

    // 🔑 HİÇBİR ŞEY ÇIKMAZSA —> fallback (Navbar/Footer’da da garanti görünür)
    if (ranked.length === 0) {
      return AI_CATEGORY_KEYS.slice(0, topN).map((k) => ({ key: k, count: 0 }));
    }

    return ranked;
  }, [recipes, topN]);

  return { top, loading: isFetching || isLoading, error: isError };
}
