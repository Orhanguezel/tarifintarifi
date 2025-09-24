"use client";

import { createApi } from "@reduxjs/toolkit/query/react";
import { axiosBaseQuery } from "@/lib/rtk/axiosBaseQuery";
import { buildCommonHeaders } from "@/lib/http";
import type { SupportedLocale } from "@/types/common";
import type {
  INews,
  NewsCategory,
  NewsListParams,
  NewsBySlugParams,
  ApiEnvelope,
} from "./types";

/** RTK Query — News (public) */
export const newsApi = createApi({
  reducerPath: "newsApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["News", "NewsList", "NewsCategory"],
  endpoints: (builder) => ({
    /** GET /news — list */
    list: builder.query<INews[], NewsListParams | void>({
      query: (args) => {
        const locale: SupportedLocale | undefined = args?.locale as any;
        const qs = new URLSearchParams();
        if (args?.page) qs.set("page", String(args.page));
        if (args?.limit) qs.set("limit", String(args.limit));
        if (args?.categorySlug) qs.set("category", args.categorySlug);
        if (args?.q) qs.set("q", args.q);
        if (args?.sort) qs.set("sort", args.sort);

        return {
          url: `news${qs.toString() ? `?${qs.toString()}` : ""}`,
          method: "GET",
          headers: locale ? buildCommonHeaders(locale) : undefined,
        };
      },
      transformResponse: (res: ApiEnvelope<INews[]>) => res.data ?? [],
      providesTags: (result) =>
        Array.isArray(result)
          ? [
              { type: "NewsList", id: "LIST" },
              ...result.map((x) => ({ type: "News" as const, id: x._id })),
            ]
          : [{ type: "NewsList", id: "LIST" }],
    }),

    /** GET /news/slug/:slug — single */
    bySlug: builder.query<INews, NewsBySlugParams>({
      query: ({ slug, locale }) => ({
        url: `news/slug/${encodeURIComponent(slug)}`,
        method: "GET",
        headers: locale ? buildCommonHeaders(locale) : undefined,
      }),
      transformResponse: (res: ApiEnvelope<INews>) => res.data,
      providesTags: (result) => (result ? [{ type: "News", id: result._id }] : []),
    }),

    /** GET /newscategory — categories */
    categories: builder.query<NewsCategory[], { locale?: SupportedLocale } | void>({
      query: (args) => ({
        url: "newscategory",
        method: "GET",
        headers: args?.locale ? buildCommonHeaders(args.locale) : undefined,
      }),
      transformResponse: (res: ApiEnvelope<NewsCategory[]>) => res.data ?? [],
      providesTags: (result) =>
        Array.isArray(result)
          ? [
              { type: "NewsCategory", id: "LIST" },
              ...result.map((c) => ({ type: "NewsCategory" as const, id: c._id })),
            ]
          : [{ type: "NewsCategory", id: "LIST" }],
    }),
  }),
});

export const {
  useListQuery: useNewsListQuery,
  useBySlugQuery: useNewsBySlugQuery,
  useCategoriesQuery: useNewsCategoriesQuery,
} = newsApi;
