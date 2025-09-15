"use client";

import { useMemo } from "react";
import { useListRecipesQuery } from "@/lib/recipes/api";
import type { SupportedLocale } from "@/types/common";

export function useTopRecipeCategories(locale: SupportedLocale, sampleSize = 120, topN = 10) {
  const limit = Math.max(1, Math.min(sampleSize, 120));
  const { data: recipes = [], isFetching, isLoading, isError } = useListRecipesQuery({
    locale, limit, fields: "category",
  });

  const top = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of recipes as any[]) {
      const k = (r?.category ?? "").toString().toLowerCase().trim();
      if (!k) continue;
      counts[k] = (counts[k] ?? 0) + 1;
    }
    return Object.entries(counts)
      .filter(([, c]) => c > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(([key, count]) => ({ key, count }));
  }, [recipes, topN]);

  return { top, loading: isFetching || isLoading, error: isError };
}
