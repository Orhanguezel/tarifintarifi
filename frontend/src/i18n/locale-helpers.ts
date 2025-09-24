import { SUPPORTED_LOCALES, type SupportedLocale } from "@/types/common";

export const KNOWN_RTL = new Set(["ar", "fa", "he", "ur", "ckb", "ps", "sd", "ug", "yi", "dv"]);

export const DEFAULT_LOCALE: SupportedLocale =
  (process.env.NEXT_PUBLIC_DEFAULT_LOCALE as SupportedLocale) || "tr";

export const SITE_NAME = (process.env.NEXT_PUBLIC_SITE_NAME || "ensotek.com").trim();
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001").replace(/\/+$/, "");

export const isSupportedLocale = (x: unknown): x is SupportedLocale =>
  typeof x === "string" && (SUPPORTED_LOCALES as readonly string[]).includes(x as any);

export const isRTL = (l: SupportedLocale) => KNOWN_RTL.has(l);

export function languageAlternates(defaultLocale: SupportedLocale) {
  const map: Record<string, string> = {};
  for (const loc of SUPPORTED_LOCALES) map[loc] = `/${loc}/`;
  map["x-default"] = `/${defaultLocale}/`;
  return map;
}
