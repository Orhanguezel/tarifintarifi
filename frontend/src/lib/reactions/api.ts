// src/features/reactions/api.ts
"use client";

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const baseUrl = process.env.NEXT_PUBLIC_API_BASE || "/api";

export type ReactionKind = "LIKE" | "FAVORITE" | "BOOKMARK" | "EMOJI" | "RATING";

export interface ToggleReactionBody {
  recipeId: string;
  kind: Exclude<ReactionKind, "RATING">;
  emoji?: string; // kind === "EMOJI" için zorunlu
  extra?: Record<string, unknown>;
}
export interface RateBody {
  recipeId: string;
  value: number; // 1..5
  extra?: Record<string, unknown>;
}

export interface MyReaction {
  recipeId: string;       // ObjectId (string)
  kind: ReactionKind;
  emoji?: string;
  value?: number;
}

type ApiEnvelope<T> = { success: boolean; message: string; data: T };

export const reactionsApi = createApi({
  reducerPath: "reactionsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}/reactions`,
    credentials: "include"
  }),
  tagTypes: ["Summary", "Mine"],
  endpoints: (builder) => ({
    // GET /summary?recipeId=...&breakdown=kind+emoji
    getSummary: builder.query<
      Record<
        string,
        { total: number; byKind?: Record<string, number>; byEmoji?: Record<string, number> }
      >,
      { recipeId: string; breakdown?: "none" | "kind" | "emoji" | "kind+emoji" }
    >({
      query: ({ recipeId, breakdown = "kind+emoji" }) =>
        `summary?recipeId=${encodeURIComponent(recipeId)}&breakdown=${encodeURIComponent(
          breakdown
        )}`,
      transformResponse: (res: ApiEnvelope<Record<string, any>>) => res.data,
      providesTags: (_res, _err, arg) => [{ type: "Summary", id: arg.recipeId }]
    }),

    // GET /me?recipeIds=...
    getMyReactions: builder.query<MyReaction[], { recipeId: string }>({
      query: ({ recipeId }) => `me?recipeIds=${encodeURIComponent(recipeId)}`,
      transformResponse: (res: ApiEnvelope<MyReaction[]>) => res.data,
      providesTags: (_res, _err, arg) => [{ type: "Mine", id: arg.recipeId }]
    }),

    // POST /toggle
    toggleReaction: builder.mutation<
      ApiEnvelope<{ on: boolean }>,
      ToggleReactionBody
    >({
      query: (body) => ({
        url: "toggle",
        method: "POST",
        body
      }),
      invalidatesTags: (_res, _err, body) => [
        { type: "Summary", id: body.recipeId },
        { type: "Mine", id: body.recipeId }
      ]
    }),

    // POST /rate
    rate: builder.mutation<ApiEnvelope<{ value: number }>, RateBody>({
      query: (body) => ({
        url: "rate",
        method: "POST",
        body
      }),
      invalidatesTags: (_res, _err, body) => [{ type: "Mine", id: body.recipeId }]
    })
  })
});

export const {
  useGetSummaryQuery,
  useGetMyReactionsQuery,
  useToggleReactionMutation,
  useRateMutation
} = reactionsApi;
