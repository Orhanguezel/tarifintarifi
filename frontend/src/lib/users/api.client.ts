"use client";

import { createApi } from "@reduxjs/toolkit/query/react";
import { axiosBaseQuery } from "@/lib/rtk/axiosBaseQuery";
import { buildCommonHeaders } from "@/lib/http";
import type { Me, LoginResult, RegisterResult, ChangePasswordPayload } from "./types";

/**
 * Axios baseQuery + interceptor:
 *  - X-Tenant ve Accept-Language zaten otomatik gider.
 *  - Endpoint bazında dil override etmek istersen buildCommonHeaders kullan.
 */
export const usersApi = createApi({
  reducerPath: "usersApi",
  baseQuery: axiosBaseQuery(),
  endpoints: (builder) => ({
    register: builder.mutation<
      RegisterResult,
      { email: string; password: string; role?: "admin" | "editor" | "viewer"; locale?: string }
    >({
      query: ({ email, password, role = "admin", locale = "de" }) => ({
        url: "users/register",
        method: "POST",
        headers: { ...buildCommonHeaders(locale), "Content-Type": "application/json" },
        data: { email, password, role },
      }),
    }),

    login: builder.mutation<LoginResult, { email: string; password: string; locale?: string }>({
      query: ({ email, password, locale = "de" }) => ({
        url: "users/login",
        method: "POST",
        headers: { ...buildCommonHeaders(locale), "Content-Type": "application/json" },
        data: { email, password },
      }),
    }),

    me: builder.query<Me, { locale?: string } | void>({
      query: (args) => ({
        url: "users/me",
        method: "GET",
        headers: args?.locale ? buildCommonHeaders(args.locale) : undefined,
      }),
    }),

    changePassword: builder.mutation<
      { ok: true },
      { payload: ChangePasswordPayload; locale?: string; csrf?: string; bearer?: string }
    >({
      query: ({ payload, locale = "de", csrf, bearer }) => ({
        url: "users/change-password",
        method: "POST",
        headers: {
          ...buildCommonHeaders(locale),
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
        headers: args?.locale ? buildCommonHeaders(args.locale) : undefined,
      }),
    }),

    logout: builder.mutation<void, { locale?: string } | void>({
      query: (args) => ({
        url: "users/logout",
        method: "POST",
        headers: args?.locale ? buildCommonHeaders(args.locale) : undefined,
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
