// /home/orhan/Dokumente/tariftarif/backend/src/modules/recipes/utils/i18n.ts
import { SUPPORTED_LOCALES, type SupportedLocale } from "@/types/common";
import type { TranslatedLabel } from "../types";
import { translateToAllLocales } from "@/services/translate.service";

/** Mongoose çok dilli string alan şablonu (şema için) */
export const localizedStringField = () => {
  const fields: Record<SupportedLocale, any> = {} as any;
  for (const locale of SUPPORTED_LOCALES as readonly SupportedLocale[]) {
    fields[locale] = { type: String, trim: true, default: "" };
  }
  return fields;
};

/** Runtime değer objesi üret (şema DEĞİL) */
export const emptyTranslatedLabel = (): TranslatedLabel => {
  const out: TranslatedLabel = {};
  for (const l of SUPPORTED_LOCALES as readonly SupportedLocale[]) (out as any)[l] = "";
  return out;
};

export const fillAllLocales = (input: any): TranslatedLabel => {
  const out: TranslatedLabel = {};
  const src =
    (input && typeof input === "object" && Object.keys(input).length > 0 && input) || {};
  // dolu bir referans seç (en → tr → ilk dolu)
  const ref =
    (src as any).en?.trim?.() ? (src as any).en :
    (src as any).tr?.trim?.() ? (src as any).tr :
    (Object.values(src).find((v) => String(v || "").trim()) as string) || "";

  for (const l of SUPPORTED_LOCALES as readonly SupportedLocale[]) {
    let v = String((src as any)[l] ?? ref ?? "").trim();
    (out as any)[l] = v;
  }
  return out;
};

/** Çok dilli alan normalize (trim + opsiyonel lowercase) */
export function normalizeTranslatedLabel(
  src: any,
  opts?: { trim?: boolean; lowercase?: boolean }
): TranslatedLabel {
  const out: TranslatedLabel = {};
  const isObj = src && typeof src === "object" && !Array.isArray(src);
  const base  = typeof src === "string" ? src : "";

  for (const lng of SUPPORTED_LOCALES as readonly SupportedLocale[]) {
    let v = isObj ? (src as any)[lng] : (lng === "tr" ? base : "");
    if (typeof v !== "string") v = "";
    v = opts?.trim ? v.trim() : v;
    v = opts?.lowercase ? v.toLowerCase() : v;
    (out as any)[lng] = v;
  }
  return out;
}

/** Yazım/boşluk düzeltmeleri — dil agnostik */
export function fixCommonTyposLabel(label: TranslatedLabel): TranslatedLabel {
  const out = { ...label };
  for (const lng of SUPPORTED_LOCALES as readonly SupportedLocale[]) {
    let v = String((out as any)[lng] || "");
    v = v.replace(/\s{2,}/g, " ").replace(/ ?– ?/g, " - ").trim();
    (out as any)[lng] = v;
  }
  return out;
}

/** Cümle sonu noktalaması yoksa ekle (dil bazlı) */
export function punctuateLabel(label: TranslatedLabel): TranslatedLabel {
  const out = { ...label };
  for (const lng of SUPPORTED_LOCALES as readonly SupportedLocale[]) {
    let v = String((out as any)[lng] || "").trim();
    if (!v) continue;
    const hasEnd = /[.!?…。؟]|।\s*$/.test(v);
    if (!hasEnd) {
      const end = lng === "zh" ? "。" : lng === "hi" ? "।" : ".";
      v = v + end;
    }
    (out as any)[lng] = v;
  }
  return out;
}



// eksik dilleri ilk dolu kaynaktan doldur (opsiyonel otomatik çeviri)
export async function fillMissingWithTranslation(tl: Record<SupportedLocale, string>) {
  const have = Object.entries(tl).filter(([, v]) => (v ?? "").toString().trim()).map(([k]) => k) as SupportedLocale[];
  if (have.length === 0) return tl;
  const sourceVal = tl[have[0]]!;
  const auto = process.env.RECIPES_AUTO_TRANSLATE !== "false";
  if (!auto) return tl;
  const trans = await translateToAllLocales(sourceVal);
  const out = { ...tl };
  for (const l of SUPPORTED_LOCALES as readonly SupportedLocale[]) {
    if (!out[l] || !out[l]!.trim()) out[l] = trans[l];
  }
  return out;
}


export async function replaceClonedEnglish(
  tl: TranslatedLabel
): Promise<TranslatedLabel> {
  const out: TranslatedLabel = { ...(tl || {}) };
  const enSrc = String((out as any).en ?? "").trim();
  if (!enSrc) return out;

  // EN’i diğer dillere yapıştırmışsa → o diller için gerçek çeviri yap
  const needFix = (l: SupportedLocale) =>
    l !== "en" && String((out as any)[l] ?? "").trim() === enSrc;

  if (SUPPORTED_LOCALES.some(needFix)) {
    const trans = await translateToAllLocales(enSrc);
    for (const l of SUPPORTED_LOCALES as readonly SupportedLocale[]) {
      if (needFix(l)) (out as any)[l] = trans[l];
    }
  }
  return out;
}



const norm = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim();

/**
 * - Tüm dillerde aynıysa → base dışındakileri çevir
 * - Bazı diller base ile birebir aynıysa → sadece o dilleri çevir
 * - Eksikler → doldur
 */
export async function ensureRealTranslations(
  tl: TranslatedLabel,
  base: SupportedLocale
): Promise<TranslatedLabel> {
  const out: TranslatedLabel = { ...(tl || {}) };
  const vals = SUPPORTED_LOCALES
    .map(l => String((out as any)[l] ?? "").trim())
    .filter(Boolean);

  if (vals.length === 0) return out;

  const baseVal = String((out as any)[base] ?? "").trim();
  const uniq = new Set(vals.map(norm));
  const onlyBase = vals.length === 1 && !!baseVal;
  const allSame  = uniq.size === 1;

  // Çeviri kaynağını belirle
  const source = baseVal || vals[0]!;

  // Bu koşullardan biri varsa çeviri setini hazırlayalım
  const needTranslateAllSame = allSame;
  const needTranslateSomeEqBase =
    !!baseVal && SUPPORTED_LOCALES.some(l => l !== base && norm(String((out as any)[l] ?? "")) === norm(baseVal));

  if (needTranslateAllSame || needTranslateSomeEqBase || onlyBase) {
    const trans = await translateToAllLocales(source);
    for (const l of SUPPORTED_LOCALES as readonly SupportedLocale[]) {
      const cur = String((out as any)[l] ?? "").trim();
      const isEqBase = !!baseVal && norm(cur) === norm(baseVal);
      if (!cur) {
        (out as any)[l] = trans[l];                 // eksik → doldur
      } else if (l !== base && (needTranslateAllSame ? true : isEqBase)) {
        (out as any)[l] = trans[l];                 // base ile aynı → değiştir
      }
    }
    return out;
  }

  // Zaten bazı diller farklı → sadece eksikleri doldur
  for (const l of SUPPORTED_LOCALES as readonly SupportedLocale[]) {
    const cur = String((out as any)[l] ?? "").trim();
    if (!cur) {
      const trans = await translateToAllLocales(source);
      for (const k of SUPPORTED_LOCALES as readonly SupportedLocale[]) {
        if (!String((out as any)[k] ?? "").trim()) (out as any)[k] = trans[k];
      }
      break;
    }
  }
  return out;
}