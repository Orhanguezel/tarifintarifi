"use client";

import { createApi } from "@reduxjs/toolkit/query/react";
import { axiosBaseQuery } from "@/lib/rtk/axiosBaseQuery";
import { buildCommonHeaders } from "@/lib/http";
import type { SupportedLocale } from "@/types/common";
import type {
  IAbout,
  AboutCategory,
  AboutListParams,
  AboutBySlugParams,
  ApiEnvelope,
} from "./types";

/**
 * RTK Query — About & Category (public uçlar)
 *  - baseQuery: axiosBaseQuery() (tenant + Accept-Language interceptor’ları sizde zaten hazır)
 *  - locale override lazımsa buildCommonHeaders(locale) ile gönderiyoruz
 */
export const aboutApi = createApi({
  reducerPath: "aboutApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["About", "AboutList", "AboutCategory"],
  endpoints: (builder) => ({
    /** /about — list */
    list: builder.query<IAbout[], AboutListParams | void>({
      query: (args) => {
        const locale: SupportedLocale | undefined = args?.locale as any;
        const params = new URLSearchParams();

        if (args?.page) params.set("page", String(args.page));
        if (args?.limit) params.set("limit", String(args.limit));
        if (args?.categorySlug) params.set("category", args.categorySlug);
        if (args?.q) params.set("q", args.q);
        if (args?.sort) params.set("sort", args.sort);

        return {
          url: `about${params.toString() ? `?${params.toString()}` : ""}`,
          method: "GET",
          headers: locale ? buildCommonHeaders(locale) : undefined,
        };
      },
      transformResponse: (res: ApiEnvelope<IAbout[]>) => res.data ?? [],
      providesTags: (result) =>
        Array.isArray(result)
          ? [
              { type: "AboutList", id: "LIST" },
              ...result.map((x) => ({ type: "About" as const, id: x._id })),
            ]
          : [{ type: "AboutList", id: "LIST" }],
    }),

    /** /about/slug/:slug — single */
    bySlug: builder.query<IAbout, AboutBySlugParams>({
      query: ({ slug, locale }) => ({
        url: `about/slug/${encodeURIComponent(slug)}`,
        method: "GET",
        headers: locale ? buildCommonHeaders(locale) : undefined,
      }),
      transformResponse: (res: ApiEnvelope<IAbout>) => res.data,
      providesTags: (result) =>
        result ? [{ type: "About", id: result._id }] : [],
    }),

    /** /aboutcategory — categories (public) */
    categories: builder.query<AboutCategory[], { locale?: SupportedLocale } | void>({
      query: (args) => ({
        url: "aboutcategory",
        method: "GET",
        headers: args?.locale ? buildCommonHeaders(args.locale) : undefined,
      }),
      transformResponse: (res: ApiEnvelope<AboutCategory[]>) => res.data ?? [],
      providesTags: (result) =>
        Array.isArray(result)
          ? [
              { type: "AboutCategory", id: "LIST" },
              ...result.map((c) => ({ type: "AboutCategory" as const, id: c._id })),
            ]
          : [{ type: "AboutCategory", id: "LIST" }],
    }),

    // ────────────────────────────────
    // Admin uçları gerektiğinde ekleyebiliriz (create/update/delete/togglePublish)
    // create: builder.mutation(...), update: builder.mutation(...), vs.
    // ────────────────────────────────
  }),
});

export const {
  useListQuery: useAboutListQuery,
  useBySlugQuery: useAboutBySlugQuery,
  useCategoriesQuery: useAboutCategoriesQuery,
  // Admin mutations eklendiğinde export edin
} = aboutApi;
