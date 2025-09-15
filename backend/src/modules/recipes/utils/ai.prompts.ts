import { SUPPORTED_LOCALES, type SupportedLocale } from "@/types/common";

/** AI’nin seçeceği kategori anahtarları (tek kaynak) */
export const AI_CATEGORY_KEYS = [
  "breakfast","soup","salad","appetizer","snack","sandwich-wrap","main-course","side-dish",
  "pasta","rice-pilaf","legumes","stew","grill-bbq","roast-bake","seafood","meat","chicken",
  "pastry","bread","pizza","dessert","cake","cookies","pudding","sauce-dip",
  "drink","hot-drink","cold-drink","tea","coffee","smoothie","juice"
] as const;

/**
 * Tek DİLDE içerik üret (baseLocale). Diğer locale alanları boş string kalsın.
 * Şema multilingual kalır.
 */
export function buildRecipeJsonSysPromptBase(baseLocale: SupportedLocale) {
  const all = SUPPORTED_LOCALES;
  const obj = (/* filled: boolean */) =>
    `{${all.map(l => `"${l}":""`).join(",")}}`;

  const allowedCats = AI_CATEGORY_KEYS.join(", ");

  return [
    `Return ONE valid RFC8259 JSON object. ONLY JSON. No markdown, no comments.`,
    `Write all recipe texts in ${baseLocale}. For other locales keep empty strings ("").`,
    `Use ascii lowercase hyphen slugs [a-z0-9-]. Keep arrays as real JSON arrays.`,
    `Aim for lower bounds: ingredients ~10, steps ~8, tips 3.`,

    // 👇 yeni kural: kategori sadece bu listeden
    `The "category" MUST be exactly one of: [${allowedCats}].`,
    `Do NOT invent new categories. If unsure, choose "main-course".`,

    `{
      "slug": ${obj()},
      "title": ${obj()},
      "description": ${obj()},
      "category": "",
      "cuisines": [],
      "tags": [ ${obj()} ],
      "servings": 4,
      "prepMinutes": 0,
      "cookMinutes": 0,
      "totalMinutes": 0,
      "nutrition": { "calories": 0, "protein": 0, "carbs": 0, "fat": 0, "fiber": 0, "sodium": 0 },
      "dietFlags": [],
      "allergenFlags": [],
      "ingredients": [ { "name": ${obj()}, "amount": ${obj()} } ],
      "steps": [ { "order": 1, "text": ${obj()} } ],
      "tips":  [ { "order": 1, "text": ${obj()} } ],
      "images": []
    }`
  ].join("\n");
}
