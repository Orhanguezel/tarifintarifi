"use client";

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { Recipe } from "@/lib/recipes/types";
import type { SupportedLocale } from "@/types/common";
import { getApiBase, getLangHeaders, getPublicApiKey } from "@/lib/http";
import { AI_CATEGORY_KEYS } from "@/lib/recipes/categories";

/* ---------- Request args ---------- */
export type ListRecipesArgs = {
  locale: SupportedLocale;
  limit?: number;
  page?: number;
  q?: string;
  tag?: string;     // EN/slug
  hl?: string;      // yerel görünen label (backend’de öncelikli)
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

// FE normalize (ascii, lc, tire)
const normalizeCategoryKeyFE = (v: string) =>
  String(v || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

// Sadece backend’in kabul ettiği anahtarları gönder
const ALLOWED_CATS = new Set(AI_CATEGORY_KEYS as readonly string[]);
const toAllowedCategory = (v?: string) => {
  const k = v ? normalizeCategoryKeyFE(v) : "";
  return k && ALLOWED_CATS.has(k as any) ? k : "";
};

const MAX_LIST = Number(process.env.NEXT_PUBLIC_RECIPES_PUBLIC_LIST_MAX ?? 120);

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
      query: ({ locale, limit = 50, page, q, tag, hl, category, maxTime, fields }) => {
        const safeLimit = clamp(Number(limit) || 50, 1, MAX_LIST);
        const params = new URLSearchParams();
        params.set("limit", String(safeLimit));
        if (page) params.set("page", String(Math.max(1, Number(page))));
        if (q) params.set("q", q);

        // Backend: hl > tag
        if (hl) params.set("hl", hl);
        else if (tag) params.set("tag", tag);

        const cat = toAllowedCategory(category);
        if (cat) params.set("category", cat);

        if (maxTime != null) params.set("maxTime", String(maxTime));
        if (fields) params.set("fields", fields);

        return {
          url: `recipes?${params.toString()}`,
          headers: getLangHeaders(locale),
        };
      },
      transformResponse: (resp: PublicListResponse) => resp.data,
      keepUnusedDataFor: 60,
    }),

    searchSuggest: builder.query<SuccessData<Partial<Recipe>[]>, SearchSuggestArgs>({
      query: ({ locale, q, category, limit = 10 }) => {
        const safeLimit = clamp(Number(limit) || 10, 1, 25);
        const params = new URLSearchParams();
        if (q) params.set("q", q);

        const cat = toAllowedCategory(category);
        if (cat) params.set("category", cat);

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
