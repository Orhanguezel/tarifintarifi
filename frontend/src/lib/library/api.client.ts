"use client";

import { createApi } from "@reduxjs/toolkit/query/react";
import { axiosBaseQuery } from "@/lib/rtk/axiosBaseQuery";
import { buildCommonHeaders } from "@/lib/http";
import type { SupportedLocale } from "@/types/common";
import type {
  ILibrary,
  LibraryCategory,
  LibraryListParams,
  LibraryBySlugParams,
  ApiEnvelope,
} from "./types";

/**
 * RTK Query — Library (public uçlar)
 *  - axiosBaseQuery: tenant + Accept-Language interceptor hazır
 *  - locale override gerekiyorsa buildCommonHeaders(locale)
 */
export const libraryApi = createApi({
  reducerPath: "libraryApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["Library", "LibraryList", "LibraryCategory"],
  endpoints: (builder) => ({
    /** GET /library — list */
    list: builder.query<ILibrary[], LibraryListParams | void>({
      query: (args) => {
        const locale: SupportedLocale | undefined = args?.locale as any;
        const qs = new URLSearchParams();
        if (args?.page) qs.set("page", String(args.page));
        if (args?.limit) qs.set("limit", String(args.limit));
        if (args?.categorySlug) qs.set("category", args.categorySlug);
        if (args?.q) qs.set("q", args.q);
        if (args?.sort) qs.set("sort", args.sort);

        return {
          url: `library${qs.toString() ? `?${qs.toString()}` : ""}`,
          method: "GET",
          headers: locale ? buildCommonHeaders(locale) : undefined,
        };
      },
      transformResponse: (res: ApiEnvelope<ILibrary[]>) => res.data ?? [],
      providesTags: (result) =>
        Array.isArray(result)
          ? [
              { type: "LibraryList", id: "LIST" },
              ...result.map((x) => ({ type: "Library" as const, id: x._id })),
            ]
          : [{ type: "LibraryList", id: "LIST" }],
    }),

    /** GET /library/slug/:slug — single */
    bySlug: builder.query<ILibrary, LibraryBySlugParams>({
      query: ({ slug, locale }) => ({
        url: `library/slug/${encodeURIComponent(slug)}`,
        method: "GET",
        headers: locale ? buildCommonHeaders(locale) : undefined,
      }),
      transformResponse: (res: ApiEnvelope<ILibrary>) => res.data,
      providesTags: (result) => (result ? [{ type: "Library", id: result._id }] : []),
    }),

    /** GET /librarycategory — categories (public) */
    categories: builder.query<LibraryCategory[], { locale?: SupportedLocale } | void>({
      query: (args) => ({
        url: "librarycategory",
        method: "GET",
        headers: args?.locale ? buildCommonHeaders(args.locale) : undefined,
      }),
      transformResponse: (res: ApiEnvelope<LibraryCategory[]>) => res.data ?? [],
      providesTags: (result) =>
        Array.isArray(result)
          ? [
              { type: "LibraryCategory", id: "LIST" },
              ...result.map((c) => ({ type: "LibraryCategory" as const, id: c._id })),
            ]
          : [{ type: "LibraryCategory", id: "LIST" }],
    }),
  }),
});

export const {
  useListQuery: useLibraryListQuery,
  useBySlugQuery: useLibraryBySlugQuery,
  useCategoriesQuery: useLibraryCategoriesQuery,
} = libraryApi;
