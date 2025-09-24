"use client";

import { createApi } from "@reduxjs/toolkit/query/react";
import { axiosBaseQuery } from "@/lib/rtk/axiosBaseQuery";
import { buildCommonHeaders } from "@/lib/http";
import type { SupportedLocale } from "@/types/common";
import type {
  ISparepart,
  SparepartCategory,
  SparepartsListParams,
  SparepartBySlugParams,
  ApiEnvelope,
} from "./types";

/**
 * RTK Query — Spareparts (public)
 *  baseQuery: axiosBaseQuery() → tenant + Accept-Language interceptor sizde hazır
 */
export const sparepartsApi = createApi({
  reducerPath: "sparepartsApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["Sparepart", "SparepartsList", "SparepartCategory"],
  endpoints: (builder) => ({
    /** GET /sparepart — list */
    list: builder.query<ISparepart[], SparepartsListParams | void>({
      query: (args) => {
        const locale: SupportedLocale | undefined = args?.locale as any;
        const qs = new URLSearchParams();
        if (args?.page) qs.set("page", String(args.page));
        if (args?.limit) qs.set("limit", String(args.limit));
        if (args?.categorySlug) qs.set("category", args.categorySlug);
        if (args?.q) qs.set("q", args.q);
        if (args?.sort) qs.set("sort", args.sort);

        return {
          url: `sparepart${qs.toString() ? `?${qs.toString()}` : ""}`,
          method: "GET",
          headers: locale ? buildCommonHeaders(locale) : undefined,
        };
      },
      transformResponse: (res: ApiEnvelope<ISparepart[]>) => res.data ?? [],
      providesTags: (result) =>
        Array.isArray(result)
          ? [
              { type: "SparepartsList", id: "LIST" },
              ...result.map((x) => ({ type: "Sparepart" as const, id: x._id })),
            ]
          : [{ type: "SparepartsList", id: "LIST" }],
    }),

    /** GET /sparepart/slug/:slug — single */
    bySlug: builder.query<ISparepart, SparepartBySlugParams>({
      query: ({ slug, locale }) => ({
        url: `sparepart/slug/${encodeURIComponent(slug)}`,
        method: "GET",
        headers: locale ? buildCommonHeaders(locale) : undefined,
      }),
      transformResponse: (res: ApiEnvelope<ISparepart>) => res.data,
      providesTags: (result) =>
        result ? [{ type: "Sparepart", id: result._id }] : [],
    }),

    /** GET /sparepartcategory — categories (public) */
    categories: builder.query<SparepartCategory[], { locale?: SupportedLocale } | void>({
      query: (args) => ({
        url: "sparepartcategory",
        method: "GET",
        headers: args?.locale ? buildCommonHeaders(args.locale) : undefined,
      }),
      transformResponse: (res: ApiEnvelope<SparepartCategory[]>) => res.data ?? [],
      providesTags: (result) =>
        Array.isArray(result)
          ? [
              { type: "SparepartCategory", id: "LIST" },
              ...result.map((c) => ({ type: "SparepartCategory" as const, id: c._id })),
            ]
          : [{ type: "SparepartCategory", id: "LIST" }],
    }),
  }),
});

export const {
  useListQuery: useSparepartsListQuery,
  useBySlugQuery: useSparepartBySlugQuery,
  useCategoriesQuery: useSparepartCategoriesQuery,
} = sparepartsApi;
