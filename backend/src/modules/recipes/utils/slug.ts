// utils/slug.ts
import slugify from "slugify";
import { SUPPORTED_LOCALES, type SupportedLocale } from "@/types/common";
import type { TranslatedLabel } from "../types";
import { PREFERRED_CANONICAL_ORDER } from "../ai.constants";

const LOCALES = SUPPORTED_LOCALES as ReadonlyArray<SupportedLocale>;
const CANON   = PREFERRED_CANONICAL_ORDER as ReadonlyArray<SupportedLocale>;

const toStrIf = (v: unknown) => (typeof v === "string" ? v : "");

export function buildSlugPerLocale(
  input: TranslatedLabel | string | null | undefined,
  title: TranslatedLabel | string | null | undefined
): TranslatedLabel {
  const out: TranslatedLabel = {};
  const inObj  = input && typeof input === "object" && !Array.isArray(input);
  const tiObj  = title && typeof title === "object" && !Array.isArray(title);
  const tiStr  = typeof title === "string";

  for (const lng of LOCALES) {
    const raw =
      (inObj && (input as any)[lng]) ??
      (tiObj && (title as any)[lng]) ??
      (tiStr ? (title as string) : "");
    const s = toStrIf(raw).trim();
    (out as any)[lng] = s ? slugify(s, { lower: true, strict: true }) : "";
  }
  return out;
}

export function pickCanonical(
  slugObj: TranslatedLabel | string | null | undefined,
  title: TranslatedLabel | string | null | undefined
): string {
  const getStr = (src: any, lng: string): string => {
    if (!src) return "";
    if (typeof src === "string") return src.trim();
    if (typeof src === "object" && !Array.isArray(src)) {
      const v = src[lng];
      return typeof v === "string" ? v.trim() : "";
    }
    return "";
  };

  for (const lng of CANON) {
    const v = getStr(slugObj, lng) || getStr(title, lng);
    if (v) return slugify(v, { lower: true, strict: true });
  }
  const fallback = getStr(title, CANON[0]);
  return slugify(fallback || `recipe-${Date.now()}`, { lower: true, strict: true });
}
