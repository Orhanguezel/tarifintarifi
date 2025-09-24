"use client";

import { createApi } from "@reduxjs/toolkit/query/react";
import { axiosBaseQuery } from "@/lib/rtk/axiosBaseQuery";
import { buildCommonHeaders } from "@/lib/http";
import type { SupportedLocale } from "@/types/common";
import type {
  IReferences,
  ReferencesCategory,
  ReferencesListParams,
  ReferencesBySlugParams,
  ApiEnvelope,
} from "./types";

export const referencesApi = createApi({
  reducerPath: "referencesApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["References", "ReferencesList", "ReferencesCategory"],
  endpoints: (builder) => ({
    /** GET /references — list */
    list: builder.query<IReferences[], ReferencesListParams | void>({
      query: (args) => {
        const locale: SupportedLocale | undefined = args?.locale as any;
        const qs = new URLSearchParams();
        if (args?.page) qs.set("page", String(args.page));
        if (args?.limit) qs.set("limit", String(args.limit));
        if (args?.categorySlug) qs.set("category", args.categorySlug);
        if (args?.q) qs.set("q", args.q);
        if (args?.sort) qs.set("sort", args.sort);

        return {
          url: `references${qs.toString() ? `?${qs.toString()}` : ""}`,
          method: "GET",
          headers: locale ? buildCommonHeaders(locale) : undefined,
        };
      },
      transformResponse: (res: ApiEnvelope<IReferences[]>) => res.data ?? [],
      providesTags: (result) =>
        Array.isArray(result)
          ? [
              { type: "ReferencesList", id: "LIST" },
              ...result.map((x) => ({ type: "References" as const, id: x._id })),
            ]
          : [{ type: "ReferencesList", id: "LIST" }],
    }),

    /** GET /references/slug/:slug — single */
    bySlug: builder.query<IReferences, ReferencesBySlugParams>({
      query: ({ slug, locale }) => ({
        url: `references/slug/${encodeURIComponent(slug)}`,
        method: "GET",
        headers: locale ? buildCommonHeaders(locale) : undefined,
      }),
      transformResponse: (res: ApiEnvelope<IReferences>) => res.data,
      providesTags: (result) => (result ? [{ type: "References", id: result._id }] : []),
    }),

    /** GET /referencescategory — categories (public) */
    categories: builder.query<ReferencesCategory[], { locale?: SupportedLocale } | void>({
      query: (args) => ({
        url: "referencescategory",
        method: "GET",
        headers: args?.locale ? buildCommonHeaders(args.locale) : undefined,
      }),
      transformResponse: (res: ApiEnvelope<ReferencesCategory[]>) => res.data ?? [],
      providesTags: (result) =>
        Array.isArray(result)
          ? [
              { type: "ReferencesCategory", id: "LIST" },
              ...result.map((c) => ({ type: "ReferencesCategory" as const, id: c._id })),
            ]
          : [{ type: "ReferencesCategory", id: "LIST" }],
    }),
  }),
});

export const {
  useListQuery: useReferencesListQuery,
  useBySlugQuery: useReferencesBySlugQuery,
  useCategoriesQuery: useReferencesCategoriesQuery,
} = referencesApi;
