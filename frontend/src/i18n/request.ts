// src/i18n/request.ts
import {getRequestConfig} from "next-intl/server";
import {SUPPORTED_LOCALES, type SupportedLocale} from "@/types/common";

// ==== Lokal konfig (routing import ETME) ====
const LOCALES = SUPPORTED_LOCALES as readonly SupportedLocale[];

function isSupported(x?: string): x is SupportedLocale {
  return !!x && (LOCALES as readonly string[]).includes(x);
}

const DEFAULT_LOCALE: SupportedLocale = (() => {
  const env = (process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "").trim();
  return isSupported(env) ? (env as SupportedLocale) : "tr";
})();

// Kullanacağın namespace listesi (dosya adlarıyla birebir)
const NAMESPACES = [
  "common",
  "nav",
  "navbar",
  "footer",
  "home",
  "recipes",
  "comments",
  "difficulty",
  "notFound",
  "category",
  "categoryPage",
  "tagPage",
  "recipeDetail",
  "categories",
  "aiGen",
  "submitRecipe",
  "legal",
  "seo",
  "tagLabels"
] as const;

// --- Helpers ---

// "a.b.c": "val" -> {a:{b:{c:"val"}}}
function undot(flat: Record<string, any>) {
  const out: Record<string, any> = {};
  for (const [key, value] of Object.entries(flat)) {
    if (!key.includes(".")) {
      out[key] = value;
      continue;
    }
    const parts = key.split(".");
    let cur: any = out;
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i]!;
      if (i === parts.length - 1) cur[p] = value;
      else cur = cur[p] ?? (cur[p] = {});
    }
  }
  return out;
}

// Basit derin merge
function mergeDeep<T extends Record<string, any>>(target: T, src: T): T {
  for (const [k, v] of Object.entries(src)) {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      // @ts-ignore
      target[k] = mergeDeep(target[k] ?? {}, v);
    } else {
      // @ts-ignore
      target[k] = v;
    }
  }
  return target;
}

/**
 * Bir namespace dosyasını yükler.
 * - Önce `@/i18n/messages/${locale}/${ns}.json`
 * - Yoksa DEFAULT_LOCALE'dan dener
 * - O da yoksa boş döner
 * Düz obje geldiyse `{[ns]: ...}` ile sarar; noktalı anahtarları undot eder.
 */
async function loadNamespace(
  locale: SupportedLocale,
  ns: string
): Promise<Record<string, any>> {
  const tryImport = async (loc: SupportedLocale) => {
    try {
      const mod = (await import(`@/i18n/messages/${loc}/${ns}.json`)) as any;
      const raw = (mod?.default ?? {}) as Record<string, any>;
      const tree = Object.keys(raw).some((k) => k.includes(".")) ? undot(raw) : raw;
      return tree && typeof tree === "object" && ns in tree
        ? (tree as Record<string, any>)
        : { [ns]: tree };
    } catch {
      return null;
    }
  };

  const fromLocale = await tryImport(locale);
  if (fromLocale) return fromLocale;

  if (locale !== DEFAULT_LOCALE) {
    const fallback = await tryImport(DEFAULT_LOCALE);
    if (fallback) return fallback;
  }
  return { [ns]: {} };
}

export default getRequestConfig(async ({requestLocale}) => {
  const req = await requestLocale;
  const locale: SupportedLocale = isSupported(req) ? (req as SupportedLocale) : DEFAULT_LOCALE;

  // Tüm namespace'leri yükleyip tek mesaj ağacında birleştir
  let messages: Record<string, any> = {};
  for (const ns of NAMESPACES) {
    const tree = await loadNamespace(locale, ns);
    messages = mergeDeep(messages, tree);
  }

  return { locale, messages };
});
