import fs from "fs";
import path from "path";
import { SUPPORTED_LOCALES, type SupportedLocale } from "@/config/locales";

// In-memory cache
let CACHE: Partial<Record<SupportedLocale, any>> = {};

function i18nFolder() {
  // dev (ts-node-dev): .../src/i18n
  // prod (node dist):  .../dist/i18n
  return __dirname;
}

export function loadTranslations(): Record<SupportedLocale, any> {
  if (Object.keys(CACHE).length) return CACHE as Record<SupportedLocale, any>;

  for (const loc of SUPPORTED_LOCALES) {
    const file = path.join(i18nFolder(), `${loc}.json`);
    try {
      const raw = fs.readFileSync(file, "utf-8");
      CACHE[loc] = JSON.parse(raw);
    } catch {
      console.warn(`[i18n] ${file} not found, using empty dictionary for ${loc}`);
      CACHE[loc] = {};
    }
  }
  return CACHE as Record<SupportedLocale, any>;
}

export function tFactory(locale: SupportedLocale) {
  const dicts = loadTranslations();
  const en = dicts.en || {};
  const pick = (dict: any, key: string) =>
    key.split(".").reduce((acc: any, k) => (acc ? acc[k] : undefined), dict);

  return (key: string, fallback?: string) => {
    const v = pick(dicts[locale], key);
    if (typeof v === "string") return v;
    const enV = pick(en, key);
    if (typeof enV === "string") return enV;
    return fallback || key;
  };
}

// İstiyorsan aşağıyı da ekleyebilirsin (opsiyonel default export):
// export default { loadTranslations, tFactory };
