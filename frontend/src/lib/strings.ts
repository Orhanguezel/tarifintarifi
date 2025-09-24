// src/lib/strings.ts
/** Küçük yardımcılar: güvenli string/URL/locale işlemleri */

export const toStr = (v: unknown) => (v == null ? "" : String(v));

/** Başa / ekler */
export const ensureLeadingSlash = (s: string) => (s.startsWith("/") ? s : `/${s}`);

/** Sondaki /’ları temizler (root hariç) */
export const stripTrailingSlash = (s: string) => s.replace(/(?<!^)\/+$/g, "");

/** Trim + tek boşlukla birleştir */
export const squish = (s: string) => toStr(s).replace(/\s+/g, " ").trim();

/** Güvenli split (boşları at) */
export const safeSplit = (s: string, sep: RegExp | string) =>
  toStr(s).split(sep).map((x) => x.trim()).filter(Boolean);

/** Locale doğrulama (de|en|tr) */
export type Locale = "de" | "en" | "tr";
export const isLocale = (x: string): x is Locale => /^(de|en|tr)$/.test(x);

/** Cookie-value decode (kusurlu escape’a toleranslı) */
export const safeDecode = (s: string) => {
  try { return decodeURIComponent(s); } catch { return s; }
};



