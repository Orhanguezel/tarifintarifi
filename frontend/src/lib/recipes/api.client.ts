"use client";

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { Recipe, RecipeImage, Translated } from "@/lib/recipes/types";
import type { SupportedLocale } from "@/types/common";
import { getApiBase, getLangHeaders } from "@/lib/http";

/* ---------- Public Request args ---------- */
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

/* ---------- Admin Request args ---------- */
export type AdminListArgs = {
  page?: number;
  limit?: number; // 1..100
  q?: string;
  status?: "draft" | "published";
  tag?: string;
  category?: string;
};

type AdminRecipeCommon = Partial<Recipe> & {
  newFiles?: File[] | Blob[];
  removedImageKeys?: string[];
  existingImagesOrder?: string[];
};

export type AdminCreateArgs = { csrf?: string; data: AdminRecipeCommon };
export type AdminUpdateArgs = { id: string; csrf?: string; data: AdminRecipeCommon };
export type AdminPatchStatusArgs = { id: string; csrf?: string; isPublished: boolean };
export type AdminDeleteArgs = { id: string; csrf?: string };
export type AdminAddImagesArgs = { id: string; csrf?: string; files: File[] | Blob[] };
export type AdminRemoveImageArgs = { id: string; publicIdOrUrl: string; csrf?: string };
export type AdminUpdateImageMetaArgs = { id: string; publicId: string; csrf?: string; alt?: Translated; source?: string };
export type AdminReorderImagesArgs = { id: string; csrf?: string; order: string[] };
export type AdminSetCoverArgs = { id: string; publicId: string; csrf?: string };

/* ---------- helpers ---------- */
type PublicListMeta = {
  page: number; limit: number; total: number; totalPages: number;
  count: number; hasPrev: boolean; hasNext: boolean;
};
type PublicListResponse = { success: boolean; message?: string; data: Recipe[]; meta: PublicListMeta };
type SuccessData<T> = { success: true; data: T; message?: string };

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(n, max));

const normalizeCategoryKeyFE = (v: string) =>
  String(v || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const MAX_PUBLIC_LIST = Number(process.env.NEXT_PUBLIC_RECIPES_PUBLIC_LIST_MAX ?? 120);

/** Client HER ZAMAN relatif base kullanır (örn: "/api/"). */
const BASE = getApiBase().replace(/\/+$/, "") + "/";

/* ---------- FormData builders ---------- */
function appendIf<T extends string | Blob>(fd: FormData, key: string, val: T | undefined | null) {
  if (val === undefined || val === null || (typeof val === "string" && val === "")) return;
  fd.append(key, val as any);
}
const jsonString = (v: unknown) => JSON.stringify(v ?? {});

function buildRecipeFormData(input: AdminRecipeCommon): FormData {
  const fd = new FormData();

  if (input.title)       fd.append("title", jsonString(input.title));
  if (input.description) fd.append("description", jsonString(input.description));

  appendIf(fd, "category", input.category ?? undefined);
  appendIf(fd, "servings", input.servings as any);
  appendIf(fd, "prepMinutes", input.prepMinutes as any);
  appendIf(fd, "cookMinutes", input.cookMinutes as any);
  appendIf(fd, "totalMinutes", input.totalMinutes as any);
  appendIf(fd, "difficulty", input.difficulty as any);
  appendIf(fd, "order", input.order as any);
  if (typeof input.isPublished === "boolean") fd.append("isPublished", String(input.isPublished));
  if (typeof input.isActive === "boolean")    fd.append("isActive", String(input.isActive));
  appendIf(fd, "effectiveFrom", input.effectiveFrom as any);
  appendIf(fd, "effectiveTo", input.effectiveTo as any);

  if (input.nutrition) fd.append("nutrition", JSON.stringify(input.nutrition));

  if (Array.isArray(input.cuisines))      fd.append("cuisines", JSON.stringify(input.cuisines));
  if (Array.isArray(input.tags))          fd.append("tags", JSON.stringify(input.tags));
  if (Array.isArray(input.allergens))     fd.append("allergens", JSON.stringify(input.allergens));
  if (Array.isArray(input.dietFlags))     fd.append("dietFlags", JSON.stringify(input.dietFlags));
  if (Array.isArray(input.allergenFlags)) fd.append("allergenFlags", JSON.stringify(input.allergenFlags));

  if (Array.isArray(input.ingredients))
    fd.append("ingredients", JSON.stringify(
      input.ingredients.map(i => ({ name: i.name, amount: i.amount, order: i.order ?? 0 }))
    ));

  if (Array.isArray(input.steps))
    fd.append("steps", JSON.stringify(
      input.steps.map(s => ({ order: s.order ?? 1, text: s.text }))
    ));

  if (Array.isArray(input.tips))
    fd.append("tips", JSON.stringify(
      input.tips.map(t => ({ order: t.order ?? 1, text: t.text }))
    ));

  if (Array.isArray(input.removedImageKeys) && input.removedImageKeys.length) {
    fd.append("removedImageKeys", JSON.stringify(input.removedImageKeys));
  }
  if (Array.isArray(input.existingImagesOrder) && input.existingImagesOrder.length) {
    fd.append("existingImagesOrder", JSON.stringify(input.existingImagesOrder));
  }
  if (Array.isArray(input.newFiles)) {
    for (const file of input.newFiles) fd.append("images", file);
  }

  return fd;
}

/* ---------- API Slice ---------- */
export const recipesApi = createApi({
  reducerPath: "recipesApi",
  baseQuery: fetchBaseQuery({
    baseUrl: BASE,
    credentials: "include",
  }),
  tagTypes: ["AdminRecipe", "AdminRecipeList"],
  endpoints: (builder) => ({
    /* ====== PUBLIC ====== */
    listRecipes: builder.query<Recipe[], ListRecipesArgs>({
      query: ({ locale, limit = 50, q, tag, category, maxTime, fields }) => {
        const safeLimit = clamp(Number(limit) || 50, 1, MAX_PUBLIC_LIST);
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
        return { url: `recipes?${params.toString()}`, headers: getLangHeaders(locale) };
      },
      transformResponse: (resp: PublicListResponse) => resp.data,
      keepUnusedDataFor: 60,
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
        return { url: `recipes/search?${params.toString()}`, headers: getLangHeaders(locale) };
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
        headers: { ...getLangHeaders(locale), "Content-Type": "application/json" },
        body,
      }),
    }),

    /* ====== ADMIN ====== */
    adminListRecipes: builder.query<{ items: Recipe[]; page: number; limit: number; total: number }, AdminListArgs | void>({
      query: (args) => {
        const params = new URLSearchParams();
        if (args?.page)  params.set("page", String(Math.max(1, args.page)));
        if (args?.limit) params.set("limit", String(clamp(args.limit, 1, 100)));
        if (args?.q)     params.set("q", args.q);
        if (args?.status) params.set("status", args.status);
        if (args?.tag)    params.set("tag", args.tag);
        if (args?.category) params.set("category", normalizeCategoryKeyFE(args.category));
        return { url: `admin/recipes?${params.toString()}` };
      },
      providesTags: () => [{ type: "AdminRecipeList", id: "LIST" }],
    }),

    adminGetRecipe: builder.query<Recipe, string>({
      query: (id) => ({ url: `admin/recipes/${encodeURIComponent(id)}` }),
      providesTags: (_r, _e, id) => [{ type: "AdminRecipe", id }],
    }),

    adminCreateRecipe: builder.mutation<{ id: string }, AdminCreateArgs>({
      query: ({ csrf, data }) => {
        const fd = buildRecipeFormData(data);
        const headers: Record<string, string> = {};
        if (csrf) headers["x-csrf-token"] = csrf;
        return { url: `admin/recipes`, method: "POST", body: fd, headers };
      },
      invalidatesTags: () => [{ type: "AdminRecipeList", id: "LIST" }],
    }),

    adminUpdateRecipe: builder.mutation<Recipe, AdminUpdateArgs>({
      query: ({ id, csrf, data }) => {
        const fd = buildRecipeFormData(data);
        const headers: Record<string, string> = {};
        if (csrf) headers["x-csrf-token"] = csrf;
        return { url: `admin/recipes/${encodeURIComponent(id)}`, method: "PUT", body: fd, headers };
      },
      invalidatesTags: (_r, _e, a) => [
        { type: "AdminRecipe", id: a.id },
        { type: "AdminRecipeList", id: "LIST" },
      ],
    }),

    adminPatchStatus: builder.mutation<{ id: string; isPublished: boolean; publishedAt: string | null }, AdminPatchStatusArgs>({
      query: ({ id, csrf, isPublished }) => {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (csrf) headers["x-csrf-token"] = csrf;
        return { url: `admin/recipes/${encodeURIComponent(id)}/status`, method: "PATCH", headers, body: { isPublished } };
      },
      invalidatesTags: (_r, _e, a) => [
        { type: "AdminRecipe", id: a.id },
        { type: "AdminRecipeList", id: "LIST" },
      ],
    }),

    adminDeleteRecipe: builder.mutation<void, AdminDeleteArgs>({
      query: ({ id, csrf }) => {
        const headers: Record<string, string> = {};
        if (csrf) headers["x-csrf-token"] = csrf;
        return { url: `admin/recipes/${encodeURIComponent(id)}`, method: "DELETE", headers };
      },
      invalidatesTags: () => [{ type: "AdminRecipeList", id: "LIST" }],
    }),

    /* --- MEDIA --- */
    adminAddImages: builder.mutation<{ ok: true; added: RecipeImage[]; images: RecipeImage[] }, AdminAddImagesArgs>({
      query: ({ id, csrf, files }) => {
        const fd = new FormData();
        for (const f of files) fd.append("images", f);
        const headers: Record<string, string> = {};
        if (csrf) headers["x-csrf-token"] = csrf;
        return { url: `admin/recipes/${encodeURIComponent(id)}/images`, method: "POST", body: fd, headers };
      },
      invalidatesTags: (_r, _e, a) => [{ type: "AdminRecipe", id: a.id }],
    }),

    adminRemoveImage: builder.mutation<void, AdminRemoveImageArgs>({
      query: ({ id, publicIdOrUrl, csrf }) => {
        const headers: Record<string, string> = {};
        if (csrf) headers["x-csrf-token"] = csrf;
        return {
          url: `admin/recipes/${encodeURIComponent(id)}/images/${encodeURIComponent(publicIdOrUrl)}`,
          method: "DELETE",
          headers,
        };
      },
      invalidatesTags: (_r, _e, a) => [{ type: "AdminRecipe", id: a.id }],
    }),

    adminUpdateImageMeta: builder.mutation<{ ok: true; image: RecipeImage }, AdminUpdateImageMetaArgs>({
      query: ({ id, publicId, csrf, alt, source }) => {
        const fd = new FormData();
        if (alt) fd.append("alt", JSON.stringify(alt));
        if (typeof source === "string") fd.append("source", source);
        const headers: Record<string, string> = {};
        if (csrf) headers["x-csrf-token"] = csrf;
        return {
          url: `admin/recipes/${encodeURIComponent(id)}/images/${encodeURIComponent(publicId)}`,
          method: "PATCH",
          body: fd,
          headers,
        };
      },
      invalidatesTags: (_r, _e, a) => [{ type: "AdminRecipe", id: a.id }],
    }),

    adminReorderImages: builder.mutation<{ ok: true; images: RecipeImage[] }, AdminReorderImagesArgs>({
      query: ({ id, csrf, order }) => {
        const fd = new FormData();
        fd.append("order", JSON.stringify(order));
        const headers: Record<string, string> = {};
        if (csrf) headers["x-csrf-token"] = csrf;
        return { url: `admin/recipes/${encodeURIComponent(id)}/images/reorder`, method: "PATCH", body: fd, headers };
      },
      invalidatesTags: (_r, _e, a) => [{ type: "AdminRecipe", id: a.id }],
    }),

    adminSetCoverImage: builder.mutation<{ ok: true; images: RecipeImage[] }, AdminSetCoverArgs>({
      query: ({ id, publicId, csrf }) => {
        const headers: Record<string, string> = {};
        if (csrf) headers["x-csrf-token"] = csrf;
        return { url: `admin/recipes/${encodeURIComponent(id)}/cover/${encodeURIComponent(publicId)}`, method: "PATCH", headers };
      },
      invalidatesTags: (_r, _e, a) => [{ type: "AdminRecipe", id: a.id }],
    }),
  }),
});

export const {
  // Public
  useListRecipesQuery,
  useSearchSuggestQuery,
  useGetRecipeBySlugQuery,
  useGenerateRecipePublicMutation,
  useSubmitRecipeMutation,

  // Admin
  useAdminListRecipesQuery,
  useAdminGetRecipeQuery,
  useAdminCreateRecipeMutation,
  useAdminUpdateRecipeMutation,
  useAdminPatchStatusMutation,
  useAdminDeleteRecipeMutation,
  useAdminAddImagesMutation,
  useAdminRemoveImageMutation,
  useAdminUpdateImageMetaMutation,
  useAdminReorderImagesMutation,
  useAdminSetCoverImageMutation,
} = recipesApi;
