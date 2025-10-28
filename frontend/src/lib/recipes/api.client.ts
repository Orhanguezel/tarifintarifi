"use client";

import { createApi } from "@reduxjs/toolkit/query/react";
import { axiosBaseQuery } from "@/lib/rtk/axiosBaseQuery";
import type { Recipe, RecipeImage, Translated } from "@/lib/recipes/types";
import type { SupportedLocale } from "@/types/common";
import { getLangHeaders, getClientCsrfToken } from "@/lib/http";

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
  limit?: number;
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

export type AdminCreateArgs = { data: AdminRecipeCommon };
export type AdminUpdateArgs = { id: string; data: AdminRecipeCommon };
export type AdminPatchStatusArgs = { id: string; isPublished: boolean };
export type AdminDeleteArgs = { id: string };
export type AdminAddImagesArgs = { id: string; files: File[] | Blob[] };
export type AdminRemoveImageArgs = { id: string; publicIdOrUrl: string };
export type AdminUpdateImageMetaArgs = { id: string; publicId: string; alt?: Translated; source?: string };
export type AdminReorderImagesArgs = { id: string; order: string[] };
export type AdminSetCoverArgs = { id: string; publicId: string };

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

/** Backend bazen {success,data} zarflı döner; tek noktadan aç. */
const unwrap = <T,>(resp: any): T =>
  resp && typeof resp === "object" && "data" in resp ? (resp.data as T) : (resp as T);

/* ---------- FormData builders ---------- */
function appendIf<T extends string | Blob>(fd: FormData, key: string, val: T | undefined | null) {
  if (val === undefined || val === null || (typeof val === "string" && val === "")) return;
  fd.append(key, val as any);
}
const jsonString = (v: unknown) => JSON.stringify(v ?? {});

function buildRecipeFormData(input: AdminRecipeCommon, includeCsrf = true): FormData {
  const fd = new FormData();

  // --- NEW: slug'lar
  appendIf(fd, "slugCanonical", input.slugCanonical as any);
  if (input.slug) fd.append("slug", JSON.stringify(input.slug));

  // translated alanlar
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

  if (includeCsrf) {
    const c = getClientCsrfToken();
    if (c?.token) fd.append("_csrf", c.token);
  }

  return fd;
}

/* ---------- API Slice (axios base) ---------- */
export const recipesApi = createApi({
  reducerPath: "recipesApi",
  baseQuery: axiosBaseQuery(),
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
        return {
          url: `recipes?${params.toString()}`,
          method: "GET",
          headers: getLangHeaders(locale),
          withCredentials: false,
        };
      },
      transformResponse: (resp: PublicListResponse | any) => unwrap<PublicListResponse>(resp).data,
      keepUnusedDataFor: 60,
    }),

    searchSuggest: builder.query<Partial<Recipe>[], SearchSuggestArgs>({
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
          method: "GET",
          headers: getLangHeaders(locale),
          withCredentials: false,
        };
      },
      transformResponse: (resp: SuccessData<Partial<Recipe>[]> | any) => unwrap<Partial<Recipe>[]>(resp),
    }),

    getRecipeBySlug: builder.query<Recipe, GetBySlugArgs>({
      query: ({ slug, locale }) => ({
        url: `recipes/${encodeURIComponent(slug)}`,
        method: "GET",
        headers: getLangHeaders(locale),
        withCredentials: false,
      }),
      transformResponse: (resp: SuccessData<Recipe> | any) => unwrap<Recipe>(resp),
    }),

    generateRecipePublic: builder.mutation<Recipe, AiGeneratePayload>({
      query: ({ locale, body }) => ({
        url: `recipes/generate`,
        method: "POST",
        headers: { ...getLangHeaders(locale), "Content-Type": "application/json" },
        data: body,
        withCredentials: false,
      }),
      transformResponse: (resp: SuccessData<Recipe> | any) => unwrap<Recipe>(resp),
    }),

    submitRecipe: builder.mutation<Recipe, SubmitRecipePayload>({
      query: ({ locale, body }) => ({
        url: `recipes/submit`,
        method: "POST",
        headers: { ...getLangHeaders(locale), "Content-Type": "application/json" },
        data: body,
        withCredentials: false,
      }),
      transformResponse: (resp: SuccessData<Recipe> | any) => unwrap<Recipe>(resp),
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
        return { url: `admin/recipes?${params.toString()}`, method: "GET" };
      },
      transformResponse: (resp: any) => {
        const v = unwrap<any>(resp);
        if (Array.isArray(v)) return { items: v, page: 1, limit: v.length, total: v.length };
        if (v?.items) return { items: v.items, page: v.page ?? v.meta?.page ?? 1, limit: v.limit ?? v.meta?.limit ?? 50, total: v.total ?? v.meta?.total ?? v.items.length };
        if (v?.data?.items) {
          const m = v.data?.meta || v.meta;
          return { items: v.data.items, page: m?.page ?? 1, limit: m?.limit ?? 50, total: m?.total ?? v.data.items.length };
        }
        return { items: [], page: 1, limit: 50, total: 0 };
      },
      providesTags: () => [{ type: "AdminRecipeList", id: "LIST" }],
    }),

    adminGetRecipe: builder.query<Recipe, string>({
      query: (id) => ({ url: `admin/recipes/${encodeURIComponent(id)}`, method: "GET" }),
      transformResponse: (resp: any) => unwrap<Recipe>(resp),
      providesTags: (_r, _e, id) => [{ type: "AdminRecipe", id }],
    }),

    adminCreateRecipe: builder.mutation<{ id: string }, AdminCreateArgs>({
      query: ({ data }) => {
        const fd = buildRecipeFormData(data, true);
        const c = getClientCsrfToken();
      const headers: Record<string, string> = {};
       if (c?.token) headers["X-CSRF-Token"] = c.token;
       return { url: `admin/recipes`, method: "POST", data: fd, headers };
      },
      transformResponse: (resp: any) => {
        const v = unwrap<any>(resp);
        return { id: v?.id || v?._id || v?.data?.id || v?.data?._id };
      },
      invalidatesTags: () => [{ type: "AdminRecipeList", id: "LIST" }],
    }),

    adminUpdateRecipe: builder.mutation<Recipe, AdminUpdateArgs>({
      query: ({ id, data }) => {
        const fd = buildRecipeFormData(data, true);
        const c = getClientCsrfToken();
        const headers: Record<string, string> = {};
        if (c?.token) headers["X-CSRF-Token"] = c.token;
        return { url: `admin/recipes/${encodeURIComponent(id)}`, method: "PUT", data: fd, headers };
      },
      transformResponse: (resp: any) => unwrap<Recipe>(resp),
      invalidatesTags: (_r, _e, a) => [
        { type: "AdminRecipe", id: a.id },
        { type: "AdminRecipeList", id: "LIST" },
      ],
    }),

    adminPatchStatus: builder.mutation<{ id: string; isPublished: boolean; publishedAt: string | null }, AdminPatchStatusArgs>({
      query: ({ id, isPublished }) => ({
        url: `admin/recipes/${encodeURIComponent(id)}/status`,
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        data: { isPublished },
      }),
      transformResponse: (resp: any) => unwrap<{ id: string; isPublished: boolean; publishedAt: string | null }>(resp),
      invalidatesTags: (_r, _e, a) => [
        { type: "AdminRecipe", id: a.id },
        { type: "AdminRecipeList", id: "LIST" },
      ],
    }),

    adminDeleteRecipe: builder.mutation<void, AdminDeleteArgs>({
      query: ({ id }) => ({ url: `admin/recipes/${encodeURIComponent(id)}`, method: "DELETE" }),
      invalidatesTags: () => [{ type: "AdminRecipeList", id: "LIST" }],
    }),

    /* --- MEDIA --- */
    adminAddImages: builder.mutation<{ ok: true; added: RecipeImage[]; images: RecipeImage[] }, AdminAddImagesArgs>({
      query: ({ id, files }) => {
        const fd = new FormData();
        for (const f of files) fd.append("images", f);
       const c = getClientCsrfToken();
       if (c?.token) fd.append("_csrf", c.token); // body’de kalsın
       const headers: Record<string, string> = {};
       if (c?.token) headers["X-CSRF-Token"] = c.token; // header’a da koy
       return { url: `admin/recipes/${encodeURIComponent(id)}/images`, method: "POST", data: fd, headers };
      },
      transformResponse: (resp: any) => unwrap<{ ok: true; added: RecipeImage[]; images: RecipeImage[] }>(resp),
      invalidatesTags: (_r, _e, a) => [{ type: "AdminRecipe", id: a.id }],
    }),

    adminRemoveImage: builder.mutation<void, AdminRemoveImageArgs>({
      query: ({ id, publicIdOrUrl }) => ({
        url: `admin/recipes/${encodeURIComponent(id)}/images/${encodeURIComponent(publicIdOrUrl)}`,
        method: "DELETE",
      }),
      invalidatesTags: (_r, _e, a) => [{ type: "AdminRecipe", id: a.id }],
    }),

    adminUpdateImageMeta: builder.mutation<{ ok: true; image: RecipeImage }, AdminUpdateImageMetaArgs>({
      query: ({ id, publicId, alt, source }) => {
        const fd = new FormData();
        if (alt) fd.append("alt", JSON.stringify(alt));
        if (typeof source === "string") fd.append("source", source);
        const c = getClientCsrfToken();
        if (c?.token) fd.append("_csrf", c.token);
        return {
          url: `admin/recipes/${encodeURIComponent(id)}/images/${encodeURIComponent(publicId)}`,
          method: "PATCH",
          data: fd,
        };
      },
      transformResponse: (resp: any) => unwrap<{ ok: true; image: RecipeImage }>(resp),
      invalidatesTags: (_r, _e, a) => [{ type: "AdminRecipe", id: a.id }],
    }),

    adminReorderImages: builder.mutation<{ ok: true; images: RecipeImage[] }, AdminReorderImagesArgs>({
      query: ({ id, order }) => {
        const fd = new FormData();
        fd.append("order", JSON.stringify(order));
        const c = getClientCsrfToken();
        if (c?.token) fd.append("_csrf", c.token);
        return { url: `admin/recipes/${encodeURIComponent(id)}/images/reorder`, method: "PATCH", data: fd };
      },
      transformResponse: (resp: any) => unwrap<{ ok: true; images: RecipeImage[] }>(resp),
      invalidatesTags: (_r, _e, a) => [{ type: "AdminRecipe", id: a.id }],
    }),

    adminSetCoverImage: builder.mutation<{ ok: true; images: RecipeImage[] }, AdminSetCoverArgs>({
      query: ({ id, publicId }) => {
        const c = getClientCsrfToken();
        const headers: Record<string, string> = {};
        if (c?.token) {
          headers["X-CSRF-Token"] = c.token;
        }
        return {
          url: `admin/recipes/${encodeURIComponent(id)}/cover/${encodeURIComponent(publicId)}`,
          method: "PATCH",
          headers,
        };
      },
      transformResponse: (resp: any) => unwrap<{ ok: true; images: RecipeImage[] }>(resp),
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
