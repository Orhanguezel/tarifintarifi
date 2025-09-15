"use client";

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { Recipe } from "@/lib/recipes/types";
import type { SupportedLocale } from "@/types/common";
import { getApiBase, getLangHeaders, getPublicApiKey } from "@/lib/http";

/* ---------- Request args ---------- */
export type ListRecipesArgs = {
  locale: SupportedLocale;
  limit?: number;
  q?: string;
  tag?: string;
  category?: string;
  maxTime?: number;
  fields?: string;
};

export type SearchSuggestArgs = {
  locale: SupportedLocale;
  q?: string;
  category?: string;
  limit?: number;
};

export type GetBySlugArgs = { locale: SupportedLocale; slug: string };

export type AiGeneratePayload = {
  locale: SupportedLocale;
  body: {
    lang?: SupportedLocale;
    cuisine?: string;
    vegetarian?: boolean;
    vegan?: boolean;
    glutenFree?: boolean;
    lactoseFree?: boolean;
    servings?: number;
    maxMinutes?: number;
    includeIngredients?: string[];
    excludeIngredients?: string[];
    category?: string;
    prompt?: string;
  };
};

export type SubmitRecipePayload = {
  locale: SupportedLocale;
  body: {
    title: string;
    category?: string;
    totalMinutes?: number;
    calories?: number;
    ingredientsText?: string;
    stepsText?: string;
    servings?: number;
    images?: Array<{
      url: string;
      thumbnail: string;
      webp?: string;
      publicId?: string;
      alt?: Record<SupportedLocale, string>;
      source?: string;
    }>;
    cuisines?: string[];
    tags?: string[];
    description?: string;
  };
};

/* ---------- helpers ---------- */
type PublicListMeta = {
  page: number; limit: number; total: number; totalPages: number;
  count: number; hasPrev: boolean; hasNext: boolean;
};
type PublicListResponse = { success: boolean; message?: string; data: Recipe[]; meta: PublicListMeta };
type SuccessData<T> = { success: true; data: T; message?: string };

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(n, max));

// FE tarafında da kategori’yi normalize et (BE validator’a uyumlu)
const normalizeCategoryKeyFE = (v: string) =>
  String(v || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

/**
 * Merkezî base URL:
 * - NEXT_PUBLIC_BACKEND_ORIGIN boş ise: "/api" (same-origin)
 * - dolu ise: "https://.../api" (cross-origin)
 */
const ABS_BASE = (getApiBase() || "/api").replace(/\/+$/, "") + "/";

/* ---------- API Slice ---------- */
export const recipesApi = createApi({
  reducerPath: "recipesApi",
  baseQuery: fetchBaseQuery({
    baseUrl: ABS_BASE,
    credentials: "include",
  }),
  endpoints: (builder) => ({
    listRecipes: builder.query<Recipe[], ListRecipesArgs>({
      query: ({ locale, limit = 50, q, tag, category, maxTime, fields }) => {
        const safeLimit = clamp(Number(limit) || 50, 1, 120);
        const params = new URLSearchParams();
        params.set("limit", String(safeLimit));
        if (q) params.set("q", q);
        if (tag) params.set("tag", tag);
        if (category) {
          const cat = normalizeCategoryKeyFE(category);
          if (cat) params.set("category", cat);
        }
        if (maxTime != null) params.set("maxTime", String(maxTime));
        if (fields) params.set("fields", fields);
        return {
          url: `recipes?${params.toString()}`,
          headers: getLangHeaders(locale),
        };
      },
      transformResponse: (resp: PublicListResponse) => resp.data,
    }),

    searchSuggest: builder.query<SuccessData<Partial<Recipe>[]>, SearchSuggestArgs>({
      query: ({ locale, q, category, limit = 10 }) => {
        const safeLimit = clamp(Number(limit) || 10, 1, 25);
        const params = new URLSearchParams();
        if (q) params.set("q", q);
        if (category) {
          const cat = normalizeCategoryKeyFE(category);
          if (cat) params.set("category", cat);
        }
        params.set("limit", String(safeLimit));
        return {
          url: `recipes/search?${params.toString()}`,
          headers: getLangHeaders(locale),
        };
      },
    }),

    getRecipeBySlug: builder.query<Recipe, GetBySlugArgs>({
      query: ({ slug, locale }) => ({
        url: `recipes/${encodeURIComponent(slug)}`,
        headers: getLangHeaders(locale),
      }),
      transformResponse: (resp: SuccessData<Recipe>) => resp.data,
    }),

    generateRecipePublic: builder.mutation<SuccessData<Recipe>, AiGeneratePayload>({
      query: ({ locale, body }) => ({
        url: `recipes/generate`,
        method: "POST",
        headers: { ...getLangHeaders(locale), "Content-Type": "application/json" },
        body,
      }),
    }),

    submitRecipe: builder.mutation<SuccessData<Recipe>, SubmitRecipePayload>({
      query: ({ locale, body }) => ({
        url: `recipes/submit`,
        method: "POST",
        headers: {
          ...getLangHeaders(locale),
          "Content-Type": "application/json",
          "x-api-key": getPublicApiKey(),
        },
        body,
      }),
    }),
  }),
});

export const {
  useListRecipesQuery,
  useSearchSuggestQuery,
  useGetRecipeBySlugQuery,
  useGenerateRecipePublicMutation,
  useSubmitRecipeMutation,
} = recipesApi;
