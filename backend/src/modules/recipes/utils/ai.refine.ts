import { SUPPORTED_LOCALES, type SupportedLocale } from "@/types/common";
import type { TranslatedLabel } from "../types";
import { llmChat, extractJsonSafe } from "@/services/llm.service";

const BEVERAGE_KEYS = [
  "tea","drink","beverage","infusion","coffee","smoothie","juice",
  "hot-drink","cold-drink"
];

/** Adım aralığı (içecekler 4–6, diğerleri 8–12) */
export function determineStepRangeByCategory(category?: string | null) {
  const c = String(category || "").toLowerCase();
  const isBeverage = BEVERAGE_KEYS.some((k) => c.includes(k));
  return { isBeverage, min: isBeverage ? 4 : 8, max: isBeverage ? 6 : 12 };
}

/** Malzeme aralığı (içecekler 2–8, diğerleri 10–20) */
export function determineIngredientRangeByCategory(category?: string | null) {
  const c = String(category || "").toLowerCase();
  const isBeverage = BEVERAGE_KEYS.some((k) => c.includes(k));
  return { isBeverage, min: isBeverage ? 2 : 10, max: isBeverage ? 8 : 20 };
}

function localesJsonShape() {
  const fields = SUPPORTED_LOCALES.map((l) => `"${l}":""`).join(",");
  return `{ ${fields} }`;
}

/** Metinden ilk JSON dizisini esnekçe çıkar */
function parseFirstJsonArray(text: string): any[] | undefined {
  if (!text) return undefined;
  try {
    const direct = JSON.parse(text);
    if (Array.isArray(direct)) return direct;
  } catch { /* ignore */ }
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start >= 0 && end > start) {
    const slice = text.slice(start, end + 1);
    try {
      const arr = JSON.parse(slice);
      if (Array.isArray(arr)) return arr;
    } catch { /* ignore */ }
  }
  return undefined;
}

/** 1..N yeniden sıralama + azami kırpma */
function reindex1N<T extends { order?: number }>(arr: T[], max?: number): T[] {
  const out = (arr || []).map((x, i) => ({ ...x, order: i + 1 })) as T[];
  return typeof max === "number" && out.length > max ? out.slice(0, max) : out;
}

/* ---------- STEPS (genişletme) ---------- */
export async function expandStepsIfTooShort(
  stepsIn: Array<{ order: number; text: Record<SupportedLocale, string> }>,
  minSteps: number,
  maxSteps: number
) {
  if (!Array.isArray(stepsIn) || stepsIn.length >= minSteps) return stepsIn;

  const jsonFields = localesJsonShape();
  const sys = [
    "You rewrite cooking steps with clarity and precision for a multilingual audience.",
    `Return ONLY a JSON array of step objects: [ { "order": 1, "text": ${jsonFields} }, ... ]`,
    "No commentary, no markdown fences.",
    `Output length: between ${minSteps} and ${maxSteps} steps.`,
    "Keep the core technique intact; expand into finer-grained, sequential actions if needed.",
    "All locales must be filled with natural, non-empty text.",
  ].join("\n");

  const user = `Current steps (possibly too short):\n${JSON.stringify(stepsIn)}\n\nRewrite to ${minSteps}–${maxSteps} steps.`;

  const raw = await llmChat({
    messages: [{ role: "system", content: sys }, { role: "user", content: user }],
    temperature: 0.25,
  });

  let arr = extractJsonSafe(raw);
  if (!Array.isArray(arr)) {
    const text = String((raw as any)?.content ?? raw ?? "");
    arr = parseFirstJsonArray(text);
  }

  const mapped = Array.isArray(arr)
    ? arr
        .map((s: any) => ({
          order: Number.isFinite(Number(s?.order)) ? Number(s.order) : 0,
          text: (s?.text && typeof s.text === "object") ? s.text : {},
        }))
        .filter((s: any) => Object.values(s.text).some((v) => String(v || "").trim()))
    : stepsIn;

  const out = reindex1N(mapped, maxSteps);
  return out.length >= minSteps ? out : stepsIn;
}

/* ---------- TAGS (genişletme) ---------- */
export async function expandTagsIfTooShort(
  tagsIn: TranslatedLabel[],
  context: {
    title: TranslatedLabel;
    description: TranslatedLabel;
    cuisines: string[];
    category?: string | null;
    dietFlags?: string[];
  }
) {
  if (!Array.isArray(tagsIn) || tagsIn.length >= 10) return tagsIn;

  const jsonFields = localesJsonShape();
  const sys = [
    "You generate rich multilingual culinary tags.",
    `Return ONLY a JSON array of tag objects: [ ${jsonFields}, ... ]`,
    "No commentary, no markdown fences.",
    "Count: 10–20 tags total.",
    "Cover technique, key ingredients, dietary labels (if applicable), region/cuisine, occasion/time, difficulty or method.",
    "All locales must be filled with natural, non-empty text.",
  ].join("\n");

  const userPayload = {
    currentTags: tagsIn,
    title: context.title,
    description: context.description,
    cuisines: context.cuisines,
    category: context.category || null,
    dietFlags: context.dietFlags || [],
  };
  const user = `Context:\n${JSON.stringify(userPayload)}\n\nGenerate 10–20 multilingual tags.`;

  const raw = await llmChat({
    messages: [{ role: "system", content: sys }, { role: "user", content: user }],
    temperature: 0.3,
  });

  let arr = extractJsonSafe(raw);
  if (!Array.isArray(arr)) {
    arr = parseFirstJsonArray(String((raw as any)?.content ?? raw ?? ""));
  }

  const out = Array.isArray(arr)
    ? arr.map((t: any) => (t && typeof t === "object" ? t : null)).filter(Boolean)
    : tagsIn;

  return out.length >= 10 ? (out as TranslatedLabel[]) : tagsIn;
}

/* ---------- INGREDIENTS (genişletme) ---------- */
export async function expandIngredientsIfTooShort(
  ingredientsIn: Array<{
    name: Record<SupportedLocale, string>;
    amount?: Record<SupportedLocale, string>;
    order?: number;
  }>,
  minIngr: number,
  maxIngr: number,
  context: {
    title: TranslatedLabel;
    description: TranslatedLabel;
    cuisines: string[];
    category?: string | null;
    include?: string[];
    exclude?: string[];
    dietFlags?: string[];
  }
) {
  if (!Array.isArray(ingredientsIn) || ingredientsIn.length >= minIngr) return ingredientsIn;

  const jsonFields = localesJsonShape();
  const sys = [
    "You expand ingredient lists for recipes, ensuring realistic quantities and multilingual coverage.",
    `Return ONLY a JSON array like: [ { "name": ${jsonFields}, "amount": ${jsonFields}, "order": 0 }, ... ]`,
    "No commentary, no markdown fences.",
    `Target count: between ${minIngr} and ${maxIngr} total items.`,
    "Keep existing intent; include bases (dough/batter), fillings, aromatics, fats, seasonings, finishers.",
    "Use realistic units (g, ml, tbsp, tsp, cup, piece). Keep numbers consistent across locales.",
    "All locales must be filled with natural, non-empty text.",
  ].join("\n");

  const payload = { context, current: ingredientsIn };
  const user = `Context & current ingredients:\n${JSON.stringify(payload)}\n\nExpand to ${minIngr}–${maxIngr} ingredients with amounts.`;

  const raw = await llmChat({
    messages: [{ role: "system", content: sys }, { role: "user", content: user }],
    temperature: 0.25,
  });

  let arr = extractJsonSafe(raw);
  if (!Array.isArray(arr)) {
    arr = parseFirstJsonArray(String((raw as any)?.content ?? raw ?? ""));
  }

  const mapped = Array.isArray(arr)
    ? arr
        .map((i: any, idx: number) => ({
          name: (i?.name && typeof i.name === "object") ? i.name : {},
          amount: (i?.amount && typeof i.amount === "object") ? i.amount : undefined,
          order: Number.isFinite(Number(i?.order)) ? Number(i.order) : idx,
        }))
        .filter((i: any) => Object.values(i.name).some((v) => String(v || "").trim()))
    : ingredientsIn;

  const out = reindex1N(mapped, maxIngr);
  return out.length >= minIngr ? out : ingredientsIn;
}
