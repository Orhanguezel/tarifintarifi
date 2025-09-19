"use client";

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getApiBase, getLangHeaders } from "@/lib/http";
import type { Me, LoginResult, RegisterResult, ChangePasswordPayload } from "./types";

/** Client, HER ZAMAN relatif base kullanır (örn: "/api"). */
const BASE = getApiBase().replace(/\/+$/, "") + "/";

export const usersApi = createApi({
  reducerPath: "usersApi",
  baseQuery: fetchBaseQuery({
    baseUrl: BASE,                 // örn: "/api/"
    credentials: "include",        // httpOnly cookie için gerekli
  }),
  endpoints: (builder) => ({
    register: builder.mutation<
      RegisterResult,
      { email: string; password: string; role?: "admin" | "editor" | "viewer"; locale?: string }
    >({
      query: ({ email, password, role = "admin", locale = "tr" }) => ({
        url: "users/register",
        method: "POST",
        headers: { ...getLangHeaders(locale), "Content-Type": "application/json" },
        body: { email, password, role },
      }),
    }),

    login: builder.mutation<LoginResult, { email: string; password: string; locale?: string }>({
      query: ({ email, password, locale = "tr" }) => ({
        url: "users/login",
        method: "POST",
        headers: { ...getLangHeaders(locale), "Content-Type": "application/json" },
        body: { email, password },
      }),
    }),

    me: builder.query<Me, { locale?: string } | void>({
      query: (args) => ({
        url: "users/me",
        headers: getLangHeaders(args?.locale || "tr"),
      }),
    }),

    changePassword: builder.mutation<
      { ok: true },
      { payload: ChangePasswordPayload; locale?: string; csrf?: string; bearer?: string }
    >({
      query: ({ payload, locale = "tr", csrf, bearer }) => {
        const headers: Record<string, string> = {
          ...getLangHeaders(locale),
          "Content-Type": "application/json",
        };
        if (csrf) headers["X-CSRF-Token"] = csrf;
        if (bearer) headers["Authorization"] = `Bearer ${bearer}`;
        return { url: "users/change-password", method: "POST", headers, body: payload };
      },
    }),

    refresh: builder.mutation<{ ok: true }, { locale?: string } | void>({
      query: (args) => ({
        url: "users/refresh",
        method: "POST",
        headers: getLangHeaders(args?.locale || "tr"),
      }),
    }),

    logout: builder.mutation<void, { locale?: string } | void>({
      query: (args) => ({
        url: "users/logout",
        method: "POST",
        headers: getLangHeaders(args?.locale || "tr"),
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
