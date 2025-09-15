// src/types/recipes/common.ts

// 🌍 Recipes modülü için desteklenen 10 dil (tenant'a özel)
export const SUPPORTED_LOCALES = [
  "tr", // Türkçe
  "en", // English
  "fr", // Français
  "de", // Deutsch
  "it", // Italiano
  "pt", // Português
  "ar", // العربية
  "ru", // Русский
  "zh", // 中文 (简体)
  "hi", // हिन्दी
] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

// 🏷️ Çok dilli etiket tipleri
// Backward-compatible: alanlar opsiyonel, FE/BE kısmi girişlere izin verir
export type TranslatedLabel = Partial<Record<SupportedLocale, string>>;

// Tüm dillerin zorunlu olduğu durumlar için (opsiyonel)
export type StrictTranslatedLabel = Record<SupportedLocale, string>;

// 👁️‍🗨️ Dil label'ları
export const LANG_LABELS: Record<SupportedLocale, string> = {
  tr: "Türkçe",
  en: "English",
  fr: "Français",
  de: "Deutsch",
  it: "Italiano",
  pt: "Português",
  ar: "العربية",
  ru: "Русский",
  zh: "中文(简体)",
  hi: "हिन्दी",
};

// 📅 Tarih formatları (UI gösterimleri için)
export const DATE_FORMATS: Record<SupportedLocale, string> = {
  tr: "dd.MM.yyyy",
  en: "yyyy-MM-dd",
  fr: "dd/MM/yyyy",
  de: "dd.MM.yyyy",
  it: "dd/MM/yyyy",
  pt: "dd/MM/yyyy",
  ar: "dd/MM/yyyy",
  ru: "dd.MM.yyyy",
  zh: "yyyy/MM/dd",
  hi: "dd/MM/yyyy",
};

// 🌐 Intl / date-fns vb. için locale map
export const LOCALE_MAP: Record<SupportedLocale, string> = {
  tr: "tr-TR",
  en: "en-US",
  fr: "fr-FR",
  de: "de-DE",
  it: "it-IT",
  pt: "pt-PT",
  ar: "ar-SA",
  ru: "ru-RU",
  zh: "zh-CN",
  hi: "hi-IN",
};

// Eski adla da erişmek isteyenler için (senin örneğindeki gibi)
export function getDateLocale(locale: SupportedLocale): string {
  return LOCALE_MAP[locale] || "en-US";
}

// Sık kullanılan yardımcılar
export function getLocaleStringFromLang(lang: SupportedLocale): string {
  return LOCALE_MAP[lang] || "en-US";
}

/** Çok dilli bir alanda (örn. title, name) dil-fallback okuma */
export function getMultiLang(
  obj?: TranslatedLabel | Record<string, string>,
  lang?: SupportedLocale
): string {
  if (!obj) return "—";
  if (lang && obj[lang]) return obj[lang] as string;

  // Yaygın fallback sırası: tr → en → listedeki ilk değer
  return (
    (obj as any).tr ||
    (obj as any).en ||
    Object.values(obj)[0] ||
    "—"
  );
}
