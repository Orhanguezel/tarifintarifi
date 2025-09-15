// /home/orhan/Dokumente/tariftarif/backend/src/modules/recipes/utils/content.ts
import slugify from "slugify";
import { SUPPORTED_LOCALES, type SupportedLocale } from "@/types/common";
import type { INutrition, TranslatedLabel } from "../types";
import { normalizeTranslatedLabel, fixCommonTyposLabel, punctuateLabel } from "./i18n";
import { SERVE_CUES, SERVE_TEXT, TAG_CANON, canonicalizeCuisine } from "../ai.constants";
import { parseIfJson, toStringArray } from "./parse";

/* -------------------------------------------------------
 * Tag normalization (+canon), cuisines, ingredients, steps
 * -----------------------------------------------------*/

/** tags: string[] | TranslatedLabel[] → normalize + dedupe */
export const normalizeTagsInput = (raw: any): TranslatedLabel[] | undefined => {
  const arr = parseIfJson(raw);
  if (!Array.isArray(arr)) return undefined;

  let tags: TranslatedLabel[] = arr.map((t: any) =>
    normalizeTranslatedLabel(
      t && typeof t === "object" ? t : { tr: String(t || "") },
      { lowercase: true, trim: true }
    )
  );

  // sözlükle sertleştir
  tags = tags.map((t) => {
    const key = slugify(String((t as any).en || (t as any).tr || Object.values(t)[0] || ""), {
      lower: true,
      strict: true,
    });
    return (TAG_CANON as any)[key] ? (TAG_CANON as any)[key] : t;
  });

  // dedupe
  const seen = new Set<string>();
  const out: TranslatedLabel[] = [];
  for (const t of tags) {
    const keySource =
      ((t as any).en && (t as any).en.trim()) ||
      ((t as any).tr && (t as any).tr.trim()) ||
      (Object.values(t).find((x) => String(x).trim()) as string) ||
      "";
    const key = slugify(keySource, { lower: true, strict: true });
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out;
};

/** Zaten TranslatedLabel[] olan tag listesinde normalize + dedupe */
export const normalizeTagsLocalized = (tags: any): TranslatedLabel[] => {
  const arr = Array.isArray(tags) ? tags : [];
  const normed: TranslatedLabel[] = arr.map((t) =>
    normalizeTranslatedLabel(
      t && typeof t === "object" ? t : { tr: String(t || "") },
      { lowercase: true, trim: true }
    )
  );
  const seen = new Set<string>();
  const out: TranslatedLabel[] = [];
  for (const t of normed) {
    const keySource =
      ((t as any).en && (t as any).en.trim()) ||
      ((t as any).tr && (t as any).tr.trim()) ||
      (Object.values(t).find((x) => String(x).trim()) as string) ||
      "";
    const key = slugify(keySource, { lower: true, strict: true });
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out;
};

/** Derived etiketleri (cuisine/dietary/kategori) eksikse ekle */
export const addDerivedTagsIfMissing = (base: TranslatedLabel[], derivedStrings: string[]): TranslatedLabel[] => {
  const existingKeys = new Set(
    base.map((o) =>
      slugify(String((o as any).en || (o as any).tr || Object.values(o || {})[0] || ""), {
        lower: true,
        strict: true,
      })
    )
  );
  const out = [...base];
  for (const s of derivedStrings.map((x) => String(x || "").trim()).filter(Boolean)) {
    const key = slugify(s, { lower: true, strict: true });
    if (!key || existingKeys.has(key)) continue;
    out.push(normalizeTranslatedLabel({ tr: s, en: s }, { lowercase: true }));
    existingKeys.add(key);
  }
  return out;
};

/** Tag sözlüğüyle sertleştir */
export const hardenTags = (tags: TranslatedLabel[]) =>
  tags.map((t) => {
    const key = slugify(String((t as any).en || (t as any).tr || ""), { lower: true, strict: true });
    return (TAG_CANON as any)[key] ? (TAG_CANON as any)[key] : t;
  });

/** cuisines: string[] → kanonik + dedupe (italian, turkish, ...) */
export const normalizeCuisines = (raw: any) => {
  const list = toStringArray(raw).map(canonicalizeCuisine);
  const set = new Set(list.filter(Boolean));
  return Array.from(set);
};

/** ingredients: name & amount çok dilli, order 0..N */
export const normalizeIngredients = (raw: any) => {
  const arr = parseIfJson(raw);
  if (!Array.isArray(arr)) return undefined;
  const mapped = arr.map((i: any, idx: number) => {
    const name = fixCommonTyposLabel(
      normalizeTranslatedLabel(parseIfJson(i?.name) || {}, { trim: true })
    );
    // amount hem string hem object gelebilir → 10 dile yay
    let amount: TranslatedLabel | undefined;
    if (i?.amount != null) {
      if (typeof i.amount === "object") {
        amount = fixCommonTyposLabel(
          normalizeTranslatedLabel(parseIfJson(i.amount) || {}, { trim: true })
        );
      } else {
        const s = String(i.amount);
        amount = fixCommonTyposLabel(normalizeTranslatedLabel({ tr: s, en: s }, { trim: true }));
      }
    }
    const order = Number.isInteger(i?.order) ? i.order : idx;
    return { name, amount, order };
  });
  mapped.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
  return mapped.map((i: any, idx: number) => ({ ...i, order: idx })); // 0..N
};

/** step sonu servis/plating var mı? */
export const hasServeCue = (text: TranslatedLabel): boolean =>
  SUPPORTED_LOCALES.some((lng) => {
    const v = String((text as any)[lng] || "");
    return (SERVE_CUES as any)[lng]?.some((r: RegExp) => r.test(v));
  });

/** Steps normalize (parametrik) */
export const normalizeStepsBase = (
  raw: any,
  opts?: { ensureServeStep?: boolean; maxSteps?: number }
) => {
  const arr = parseIfJson(raw);
  if (!Array.isArray(arr)) return undefined;

  const mapped = arr
    .map((s: any, idx: number) => ({
      order: Number.isInteger(s?.order) ? s.order : idx + 1,
      text: punctuateLabel(
        fixCommonTyposLabel(normalizeTranslatedLabel(parseIfJson(s?.text) || {}, { trim: true }))
      ),
    }))
    .filter((s: any) => Object.values(s.text).some((v) => String(v).trim().length > 0))
    .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
    .map((s: any, idx: number) => ({ ...s, order: idx + 1 })); // 1..N

  let out = mapped;
  if (opts?.ensureServeStep) {
    if (out.length === 0 || !hasServeCue(out[out.length - 1].text)) {
      out.push({ order: out.length + 1, text: SERVE_TEXT });
    }
  }
  if (opts?.maxSteps && out.length > opts.maxSteps) out = out.slice(0, opts.maxSteps);
  return out.map((s, i) => ({ ...s, order: i + 1 }));
};

/* -----------------------------
 * Difficulty, nutrition, flags
 * ---------------------------*/

/** süre → difficulty */
export const difficultyFromTime = (t?: number) => {
  const x = Number(t || 0);
  if (!Number.isFinite(x)) return "easy";
  if (x <= 30) return "easy";
  if (x <= 60) return "medium";
  return "hard";
};

/** besin */
export function parseNutrition(anyInput: any): INutrition | undefined {
  if (!anyInput) return undefined;
  const src = anyInput.nutrition || anyInput;
  const n: INutrition = {};
  const keys: (keyof INutrition)[] = ["calories", "protein", "carbs", "fat", "fiber", "sodium"];
  let has = false;
  for (const k of keys) {
    const v = (src as any)[k as string];
    if (v != null && String(v).trim() !== "") {
      const num = Math.max(0, Number(v)); // negatif engelle
      if (Number.isFinite(num)) {
        (n as any)[k] = num;
        has = true;
      }
    }
  }
  return has ? n : undefined;
}

/** alerjen bayrakları normalize */
export function sanitizeAllergenFlags(v: any): string[] | undefined {
  const ALLOWED = new Set(["gluten", "dairy", "egg", "nuts", "peanut", "soy", "sesame", "fish", "shellfish"]);
  if (!Array.isArray(v)) return undefined;
  return v.map((x) => String(x).toLowerCase().trim()).filter((x) => ALLOWED.has(x));
}

/* --- Allergen & Diet inference (from ingredients) --- */
const kw = {
  gluten: ["gluten", "un", "bugday", "buğday", "wheat", "flour", "bread", "pasta", "bulgur", "seitan"],
  dairy:  ["süt", "sut", "milk", "tereyağı", "tereyagi", "butter", "krema", "cream", "kaymak", "peynir", "cheese", "yoğurt", "yogurt", "whey", "kefir"],
  egg:    ["yumurta", "egg", "yolk", "white"],
  peanut: ["yer fıstığı", "yer fistigi", "peanut"],
  nuts:   ["fındık", "findik", "ceviz", "badem", "fıstık", "fistik", "pistachio", "hazelnut", "walnut", "almond", "cashew", "pecan"],
  soy:    ["soya", "soy", "tofu", "tempeh", "soya sosu", "soy sauce"],
  sesame: ["susam", "sesame", "tahin", "tahini"],
  fish:   ["balık", "balik", "fish", "somon", "salmon", "ton", "tuna", "anchovy", "hamsi", "levrek", "sea bass", "cod"],
  shellfish: ["karides", "shrimp", "prawn", "istakoz", "lobster", "yengeç", "crab", "midye", "mussel", "oyster", "kalamar", "squid", "scallop"],
  meat:   ["et", "beef", "dana", "kuzu", "lamb", "kıyma", "kiyma", "steak", "pork", "domuz", "bacon", "sosis", "sucuk", "pastırma", "pastirma", "hindi", "turkey", "tavuk", "chicken", "ördek", "ordek", "duck"],
};

const norm = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").trim();

const containsAny = (texts: string[], dict: string[]) =>
  texts.some((txt) => dict.some((k) => txt.includes(k)));

const ingredientTexts = (ings: any[]): string[] => {
  const out: string[] = [];
  for (const it of ings || []) {
    for (const v of Object.values((it?.name as any) || {})) if (typeof v === "string") out.push(norm(v));
    for (const v of Object.values((it?.amount as any) || {})) if (typeof v === "string") out.push(norm(v));
  }
  return out;
};

export function inferAllergenFlagsFromIngredients(ings: any[]): string[] {
  const texts = ingredientTexts(ings);
  const flags: string[] = [];
  if (containsAny(texts, kw.gluten)) flags.push("gluten");
  if (containsAny(texts, kw.dairy)) flags.push("dairy");
  if (containsAny(texts, kw.egg)) flags.push("egg");
  if (containsAny(texts, kw.peanut)) flags.push("peanut");
  if (containsAny(texts, kw.nuts)) flags.push("nuts");
  if (containsAny(texts, kw.soy)) flags.push("soy");
  if (containsAny(texts, kw.sesame)) flags.push("sesame");
  if (containsAny(texts, kw.fish)) flags.push("fish");
  if (containsAny(texts, kw.shellfish)) flags.push("shellfish");
  return Array.from(new Set(flags));
}

const DIET_ALLOWED = new Set(["vegetarian", "vegan", "gluten-free", "lactose-free"]);

export function reconcileDietFlagsWithAllergens(
  dietFlagsIn: string[] | undefined,
  inferredAllergens: Set<string>,
  ings: any[]
): string[] | undefined {
  if (!dietFlagsIn) return undefined;
  const clean = dietFlagsIn.map((x) => String(x).toLowerCase().trim()).filter((x) => DIET_ALLOWED.has(x));
  if (!clean.length) return undefined;

  const texts = ingredientTexts(ings);
  const hasMeat = containsAny(texts, kw.meat);
  const hasDairy = inferredAllergens.has("dairy");
  const hasEgg = inferredAllergens.has("egg");
  const hasFish = inferredAllergens.has("fish");
  const hasShell = inferredAllergens.has("shellfish");
  const hasGluten = inferredAllergens.has("gluten");

  const out = new Set(clean);
  if (out.has("vegan") && (hasMeat || hasDairy || hasEgg || hasFish || hasShell)) out.delete("vegan");
  if (out.has("vegetarian") && (hasMeat || hasFish || hasShell)) out.delete("vegetarian");
  if (out.has("gluten-free") && hasGluten) out.delete("gluten-free");
  if (out.has("lactose-free") && hasDairy) out.delete("lactose-free");
  return out.size ? Array.from(out) : undefined;
}

/* ------------------------
 * Tag guard & search util
 * ----------------------*/
export const FORBIDDEN_TAGS = new Set(["iftar", "sahur"]);

export function dropForbiddenTagTL(tl?: TranslatedLabel): TranslatedLabel | undefined {
  if (!tl) return undefined;
  for (const l of SUPPORTED_LOCALES as ReadonlyArray<SupportedLocale>) {
    const val = (tl as any)[l];
    if (typeof val === "string" && FORBIDDEN_TAGS.has(norm(val))) return undefined;
  }
  return tl;
}

/** esnek tag regex (diakritik toleranslı) */
export function looseTagRegex(s: string) {
  const k = s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(k, "i");
}
