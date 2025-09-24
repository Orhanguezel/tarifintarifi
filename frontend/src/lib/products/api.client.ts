"use client";

import { createApi } from "@reduxjs/toolkit/query/react";
import { axiosBaseQuery } from "@/lib/rtk/axiosBaseQuery";
import { buildCommonHeaders } from "@/lib/http";
import type { SupportedLocale } from "@/types/common";
import type {
  IEnsotekprod,
  EnsotekCategory,
  ProductsListParams,
  ProductBySlugParams,
  ApiEnvelope,
} from "./types";

/**
 * RTK Query — Products & Categories (public)
 *  - baseQuery: axiosBaseQuery()
 *  - Accept-Language/Tenant otomatik; gerekirse headers ile locale override et.
 */
export const productsApi = createApi({
  reducerPath: "productsApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["Product", "ProductList", "ProductCategory"],
  endpoints: (builder) => ({
    /** GET /ensotekprod — list */
    list: builder.query<IEnsotekprod[], ProductsListParams | void>({
      query: (args) => {
        const locale: SupportedLocale | undefined = args?.locale as any;
        const params = new URLSearchParams();

        if (args?.page) params.set("page", String(args.page));
        if (args?.limit) params.set("limit", String(args.limit));
        if (args?.categorySlug) params.set("category", args.categorySlug);
        if (args?.q) params.set("q", args.q);
        if (args?.sort) params.set("sort", args.sort);
        if (typeof args?.minPrice === "number") params.set("minPrice", String(args.minPrice));
        if (typeof args?.maxPrice === "number") params.set("maxPrice", String(args.maxPrice));
        if (args?.brand) params.set("brand", args.brand);
        if (typeof args?.isPublished === "boolean") params.set("isPublished", String(args.isPublished));

        return {
          url: `ensotekprod${params.toString() ? `?${params.toString()}` : ""}`,
          method: "GET",
          headers: locale ? buildCommonHeaders(locale) : undefined,
        };
      },
      transformResponse: (res: ApiEnvelope<IEnsotekprod[]>) => res.data ?? [],
      providesTags: (result) =>
        Array.isArray(result)
          ? [
              { type: "ProductList", id: "LIST" },
              ...result.map((x) => ({ type: "Product" as const, id: x._id })),
            ]
          : [{ type: "ProductList", id: "LIST" }],
    }),

    /** GET /ensotekprod/slug/:slug — single by slug */
    bySlug: builder.query<IEnsotekprod, ProductBySlugParams>({
      query: ({ slug, locale }) => ({
        url: `ensotekprod/slug/${encodeURIComponent(slug)}`,
        method: "GET",
        headers: locale ? buildCommonHeaders(locale) : undefined,
      }),
      transformResponse: (res: ApiEnvelope<IEnsotekprod>) => res.data,
      providesTags: (result) =>
        result ? [{ type: "Product", id: result._id }] : [],
    }),

    /** GET /ensotekprod/:id — single by id (public, gerektiğinde) */
    byId: builder.query<IEnsotekprod, { id: string; locale?: SupportedLocale }>({
      query: ({ id, locale }) => ({
        url: `ensotekprod/${encodeURIComponent(id)}`,
        method: "GET",
        headers: locale ? buildCommonHeaders(locale) : undefined,
      }),
      transformResponse: (res: ApiEnvelope<IEnsotekprod>) => res.data,
      providesTags: (result) =>
        result ? [{ type: "Product", id: result._id }] : [],
    }),

    /** GET /ensotekcategory — categories */
    categories: builder.query<EnsotekCategory[], { locale?: SupportedLocale } | void>({
      query: (args) => ({
        url: "ensotekcategory",
        method: "GET",
        headers: args?.locale ? buildCommonHeaders(args.locale) : undefined,
      }),
      transformResponse: (res: ApiEnvelope<EnsotekCategory[]>) => res.data ?? [],
      providesTags: (result) =>
        Array.isArray(result)
          ? [
              { type: "ProductCategory", id: "LIST" },
              ...result.map((c) => ({ type: "ProductCategory" as const, id: c._id })),
            ]
          : [{ type: "ProductCategory", id: "LIST" }],
    }),
  }),
});

export const {
  useListQuery: useProductsListQuery,
  useBySlugQuery: useProductBySlugQuery,
  useByIdQuery: useProductByIdQuery,
  useCategoriesQuery: useProductCategoriesQuery,
} = productsApi;
