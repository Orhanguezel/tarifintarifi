import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";
import { SUPPORTED_LOCALES, type SupportedLocale } from "@/types/common";

export const locales = SUPPORTED_LOCALES;

const isLocale = (x: string): x is SupportedLocale =>
  (SUPPORTED_LOCALES as readonly string[]).includes(x);

const envDefault = (process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "").trim();
export const defaultLocale: SupportedLocale = isLocale(envDefault) ? envDefault : "tr";

/**
 * SEO-dostu kalıplar:
 * - Liste & detay sayfaları için ayrı rotalar
 * - Gelecekte yeni modül eklemek kolay olsun diye hepsi tek yerde
 */
export const pathnames = {
  "/": "/",

  // 🔹 Kurumsal
  "/about": "/about",
  "/contact": "/contact",

  // 🔹 İçerik (kütüphane / makale)
  "/library": "/library",
  "/library/[slug]": "/library/[slug]",

  // 🔹 Referanslar
  "/references": "/references",
  "/references/[slug]": "/references/[slug]",

  // 🔹 Ürünler (ensotekprod)
  "/products": "/products",
  "/products/[slug]": "/products/[slug]",

  // 🔹 Yedek parça
  "/spare-parts": "/spare-parts",
  "/spare-parts/[slug]": "/spare-parts/[slug]",

  // 🔹 Haberler
  "/news": "/news",
  "/news/[slug]": "/news/[slug]",

  // 🔹 Arama (opsiyonel ama SEO için güzel)
  "/search": "/search",

} as const;

export const routing = defineRouting({
  locales,
  defaultLocale,
  // Her zaman /de/..., /tr/... prefix’i
  localePrefix: "always",
  pathnames,
});

// next-intl navigation helper'ları
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
