// src/lib/users/api.client.ts
"use client";

import { createApi } from "@reduxjs/toolkit/query/react";
import { axiosBaseQuery } from "@/lib/rtk/axiosBaseQuery";
import { getLangHeaders } from "@/lib/http";
import type { Me, LoginResult, RegisterResult, ChangePasswordPayload } from "./types";

/**
 * Bu slice axios tabanlı baseQuery kullanır.
 * - CSRF/dil/credentials otomatik gelir (src/lib/api.ts interceptors)
 * - İstersen endpoint özelinde header ekleyebilirsin (örn. locale override)
 */
export const usersApi = createApi({
  reducerPath: "usersApi",
  baseQuery: axiosBaseQuery(),
  endpoints: (builder) => ({
    register: builder.mutation<
      RegisterResult,
      { email: string; password: string; role?: "admin" | "editor" | "viewer"; locale?: string }
    >({
      query: ({ email, password, role = "admin", locale = "tr" }) => ({
        url: "users/register",
        method: "POST",
        headers: { ...getLangHeaders(locale), "Content-Type": "application/json" },
        data: { email, password, role },
        // Gerekirse CSRF’i kapat: csrfDisabled: true
      }),
    }),

    login: builder.mutation<LoginResult, { email: string; password: string; locale?: string }>({
      query: ({ email, password, locale = "tr" }) => ({
        url: "users/login",
        method: "POST",
        headers: { ...getLangHeaders(locale), "Content-Type": "application/json" },
        data: { email, password },
        // Login'de CSRF’i kapatmak istiyorsan:
        // csrfDisabled: true,
      }),
    }),

    me: builder.query<Me, { locale?: string } | void>({
      query: (args) => ({
        url: "users/me",
        method: "GET",
        headers: args?.locale ? getLangHeaders(args.locale) : undefined,
      }),
    }),

    changePassword: builder.mutation<
      { ok: true },
      { payload: ChangePasswordPayload; locale?: string; csrf?: string; bearer?: string }
    >({
      query: ({ payload, locale = "tr", csrf, bearer }) => ({
        url: "users/change-password",
        method: "POST",
        headers: {
          ...getLangHeaders(locale),
          "Content-Type": "application/json",
          ...(csrf ? { "X-CSRF-Token": csrf } : {}),
          ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
        },
        data: payload,
      }),
    }),

    refresh: builder.mutation<{ ok: true }, { locale?: string } | void>({
      query: (args) => ({
        url: "users/refresh",
        method: "POST",
        headers: args?.locale ? getLangHeaders(args.locale) : undefined,
      }),
    }),

    logout: builder.mutation<void, { locale?: string } | void>({
      query: (args) => ({
        url: "users/logout",
        method: "POST",
        headers: args?.locale ? getLangHeaders(args.locale) : undefined,
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

// Eğer ayrı bir isimle kullanacaksan:
export const useRegisterAdminMutation = usersApi.useRegisterMutation;
