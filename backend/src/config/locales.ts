export const SUPPORTED_LOCALES = [
  "tr", "en", "fr", "de", "it", "pt", "ar", "ru", "zh", "hi"
] as const;

export type SupportedLocale = typeof SUPPORTED_LOCALES[number];

export const DEFAULT_LOCALE: SupportedLocale =
  (process.env.DEFAULT_LOCALE as SupportedLocale) || "tr";
