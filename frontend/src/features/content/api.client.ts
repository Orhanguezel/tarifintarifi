// src/features/content/api.client.ts
"use client";
import { createApi } from "@reduxjs/toolkit/query/react";
import { axiosBaseQuery } from "@/lib/rtk/axiosBaseQuery";
import type { components } from "@/types/openapi.gen"; // openapi-typescript çıktısı

type PageListItem = components["schemas"]["PageListItem"];
type ListResponse = components["schemas"]["ListResponse"];
type PageDetail = components["schemas"]["PageDetail"];

export const contentApi = createApi({
  reducerPath: "contentApi",
  baseQuery: axiosBaseQuery(),
  endpoints: (b) => ({
    listPages: b.query<ListResponse, { type?: string; q?: string; page?: number; limit?: number; locale?: string }>({
      query: ({ type, q, page = 1, limit = 24, locale }) => ({
        url: "v1/pages",
        method: "GET",
        params: { type, q, page, limit, sort: "updatedAt_desc,id_asc" },
        headers: locale ? { "Accept-Language": locale } : undefined,
      }),
    }),
    getPage: b.query<PageDetail, { slugOrId: string; locale?: string }>({
      query: ({ slugOrId, locale }) => ({
        url: `v1/pages/${encodeURIComponent(slugOrId)}`,
        method: "GET",
        headers: locale ? { "Accept-Language": locale } : undefined,
      }),
    }),
  }),
});

export const { useListPagesQuery, useGetPageQuery } = contentApi;
