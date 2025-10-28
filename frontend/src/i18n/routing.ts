// src/i18n/routing.ts
import {defineRouting} from "next-intl/routing";
import {createNavigation} from "next-intl/navigation";
import {SUPPORTED_LOCALES, type SupportedLocale} from "@/types/common";

export const locales = SUPPORTED_LOCALES;

const isLocale = (x: string): x is SupportedLocale =>
  (SUPPORTED_LOCALES as readonly string[]).includes(x);

const envDefault = (process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "").trim();
export const defaultLocale: SupportedLocale =
  isLocale(envDefault) ? envDefault : "tr";

// Uygulamada kullandığın pattern'ler
export const pathnames = {
  "/": "/",
  "/recipes": "/recipes",
  "/recipes/[slug]": "/recipes/[slug]",
  "/recipes/submit": "/recipes/submit",
  "/recipes/category/[slug]": "/recipes/category/[slug]",
  "/ai/recipe": "/ai/recipe"
} as const;

export const routing = defineRouting({
  locales,
  defaultLocale,
  // /tr/... gibi her zaman locale prefix'i olsun:
  localePrefix: "always",
  pathnames
});

// next-intl/navigation helper'ları
export const {Link, redirect, usePathname, useRouter, getPathname} =
  createNavigation(routing);
