// src/types/common.ts

// 🌍 Tenant genelinde desteklenen diller (alfabetik)
export const SUPPORTED_LOCALES = [
  "ar", // العربية
  "de", // Deutsch
  "en", // English
  "es", // Español
  "fr", // Français
  "hi", // हिन्दी
  "it", // Italiano
  "pl", // Polski
  "pt", // Português
  "ru", // Русский
  "tr", // Türkçe
  "zh", // 中文 (简体)
] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

// 🏷️ Çok dilli etiket tipleri
export type TranslatedLabel = Partial<Record<SupportedLocale, string>>;

// Tüm dillerin zorunlu olduğu durumlar için
export type StrictTranslatedLabel = Record<SupportedLocale, string>;

// 👁️‍🗨️ Dil label'ları
export const LANG_LABELS: Record<SupportedLocale, string> = {
  ar: "العربية",
  de: "Deutsch",
  en: "English",
  es: "Español",
  fr: "Français",
  hi: "हिन्दी",
  it: "Italiano",
  pl: "Polski",
  pt: "Português",
  ru: "Русский",
  tr: "Türkçe",
  zh: "中文(简体)",
};

// 📅 Tarih formatları (UI gösterimleri için)
export const DATE_FORMATS: Record<SupportedLocale, string> = {
  ar: "dd/MM/yyyy",
  de: "dd.MM.yyyy",
  en: "yyyy-MM-dd",
  es: "dd/MM/yyyy",
  fr: "dd/MM/yyyy",
  hi: "dd/MM/yyyy",
  it: "dd/MM/yyyy",
  pl: "dd.MM.yyyy",
  pt: "dd/MM/yyyy",
  ru: "dd.MM.yyyy",
  tr: "dd.MM.yyyy",
  zh: "yyyy/MM/dd",
};

// 🌐 Intl / date-fns vb. için locale map
export const LOCALE_MAP: Record<SupportedLocale, string> = {
  ar: "ar-SA",
  de: "de-DE",
  en: "en-US",
  es: "es-ES",
  fr: "fr-FR",
  hi: "hi-IN",
  it: "it-IT",
  pl: "pl-PL",
  pt: "pt-PT",
  ru: "ru-RU",
  tr: "tr-TR",
  zh: "zh-CN",
};

// Eski adla da erişmek isteyenler için
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

  // Yaygın/istenen fallback sırası: tr → en → listedeki ilk değer
  return (
    (obj as any).tr ||
    (obj as any).en ||
    Object.values(obj)[0] ||
    "—"
  );
}
