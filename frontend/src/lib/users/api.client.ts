"use client";

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getApiBase, getLangHeaders } from "@/lib/http";
import type { Me, LoginResult, RegisterResult, ChangePasswordPayload } from "./types";

/**
 * Base URL:
 *  - NEXT_PUBLIC_BACKEND_ORIGIN yoksa: same-origin "/api"
 *  - varsa: "https://.../api"
 */
const ABS_BASE = (getApiBase() || "/api").replace(/\/+$/, "") + "/";

export const usersApi = createApi({
  reducerPath: "usersApi",
  baseQuery: fetchBaseQuery({
    baseUrl: ABS_BASE,
    // httpOnly cookie’ler (access token) için şart:
    credentials: "include",
  }),
  endpoints: (builder) => ({
    /** POST /users/register — admin/editor/viewer (default: admin) */
    register: builder.mutation<RegisterResult, { email: string; password: string; role?: "admin"|"editor"|"viewer"; locale?: string }>({
      query: ({ email, password, role = "admin", locale = "tr" }) => ({
        url: "users/register",
        method: "POST",
        headers: { ...getLangHeaders(locale), "Content-Type": "application/json" },
        body: { email, password, role },
      }),
    }),

    /** POST /users/login */
    login: builder.mutation<LoginResult, { email: string; password: string; locale?: string }>({
      query: ({ email, password, locale = "tr" }) => ({
        url: "users/login",
        method: "POST",
        headers: { ...getLangHeaders(locale), "Content-Type": "application/json" },
        body: { email, password },
      }),
    }),

    /** GET /users/me */
    me: builder.query<Me, { locale?: string } | void>({
      query: (args) => ({
        url: "users/me",
        headers: getLangHeaders(args?.["locale"] || "tr"),
      }),
    }),

    /** POST /users/change-password (auth gerekli) */
    changePassword: builder.mutation<{ ok: true }, { payload: ChangePasswordPayload; locale?: string; csrf?: string; bearer?: string }>(
      {
        query: ({ payload, locale = "tr", csrf, bearer }) => {
          const headers: Record<string, string> = { ...getLangHeaders(locale), "Content-Type": "application/json" };
          // İki farklı auth yolu destekleyelim:
          if (csrf) headers["X-CSRF-Token"] = csrf;         // Cookie tabanlı isteklerde CSRF
          if (bearer) headers["Authorization"] = `Bearer ${bearer}`; // Bearer ile istek (login response at)
          return {
            url: "users/change-password",
            method: "POST",
            headers,
            body: payload,
          };
        },
      }
    ),

    /** POST /users/refresh — (projene kalmış; şu an opsiyonel) */
    refresh: builder.mutation<{ ok: true }, { locale?: string } | void>({
      query: (args) => ({
        url: "users/refresh",
        method: "POST",
        headers: getLangHeaders(args?.["locale"] || "tr"),
      }),
    }),

    /** POST /users/logout */
    logout: builder.mutation<void, { locale?: string } | void>({
      query: (args) => ({
        url: "users/logout",
        method: "POST",
        headers: getLangHeaders(args?.["locale"] || "tr"),
      }),
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useMeQuery,
  useChangePasswordMutation,
  useRefreshMutation,
  useLogoutMutation,
} = usersApi;

export const useRegisterAdminMutation = usersApi.useRegisterMutation;