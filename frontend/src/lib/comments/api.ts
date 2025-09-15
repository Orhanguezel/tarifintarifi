// src/features/comments/api.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

/* --- Config --- */
const baseUrl = process.env.NEXT_PUBLIC_API_BASE || "/api";
const DEV_BYPASS = process.env.NEXT_PUBLIC_CAPTCHA_BYPASS_TOKEN || "";

/* --- Types --- */
export interface Pagination { page: number; pages: number; total: number; }
export interface ApiListResponse<T> { success: boolean; data: T[]; pagination: Pagination; }
export interface ApiItemResponse<T> { success: boolean; data: T; }

export interface Comment {
  _id: string;
  recipeId: string;
  userId?: string;
  name?: string;
  email?: string;
  text: string;
  createdAt: string;
}

/* --- API --- */
export const commentsApi = createApi({
  reducerPath: "commentsApi",
  baseQuery: fetchBaseQuery({
    baseUrl,
    credentials: "include", // rx_uid cookie gerekli
  }),
  tagTypes: ["Comments"],
  endpoints: (builder) => ({
    listRecipeComments: builder.query<
      ApiListResponse<Comment>,
      { recipeId: string; page?: number; limit?: number }
    >({
      query: ({ recipeId, page = 1, limit = 50 }) =>
        `comments/recipe/${recipeId}?page=${page}&limit=${limit}`,
      providesTags: (res, _err, arg) => {
        const listTag = { type: "Comments" as const, id: `LIST-${arg.recipeId}` };
        const itemTags = res?.data?.map((c) => ({ type: "Comments" as const, id: c._id })) ?? [];
        return [listTag, ...itemTags];
      },
      keepUnusedDataFor: 60,
    }),

    createRecipeComment: builder.mutation<
      ApiItemResponse<Comment>,
      {
        recipeId: string;
        body: { name: string; email: string; text: string };
        recaptchaToken?: string;
        recaptchaAction?: string;
      }
    >({
      query: ({ recipeId, body, recaptchaToken, recaptchaAction }) => {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        // Header gönder; bazı proxy’ler silerse body fallback olacak
        if (recaptchaToken) {
          headers["x-recaptcha-token"] = recaptchaToken;
          if (recaptchaAction) headers["x-recaptcha-action"] = recaptchaAction;
        } else if (DEV_BYPASS) {
          headers["x-dev-skip-captcha"] = DEV_BYPASS;
        }

        // 🔐 Aynı bilgiyi body’ye de koy → proxy silse de BE görebilsin
        const payload: any = { ...body };
        if (recaptchaToken) payload.recaptchaToken = recaptchaToken;
        if (recaptchaAction) payload.recaptchaAction = recaptchaAction;

        return {
          url: `comments/recipe/${recipeId}`,
          method: "POST",
          headers,
          body: payload,
        };
      },
      invalidatesTags: (_res, _err, arg) => [{ type: "Comments", id: `LIST-${arg.recipeId}` }],
    }),
  }),
});

export const {
  useListRecipeCommentsQuery,
  useCreateRecipeCommentMutation,
} = commentsApi;
