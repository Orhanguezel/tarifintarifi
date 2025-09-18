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
  const objEmptyAll = () => `{${all.map(l => `"${l}":""`).join(",")}}`;

  const allowedCats = AI_CATEGORY_KEYS.join(", ");

  return [
    `Return ONE valid RFC8259 JSON object. ONLY JSON. No markdown, no comments.`,
    `Write ALL textual fields ONLY in ${baseLocale}. For every other locale keep empty strings ("").`,
    `Use ascii lowercase hyphen slugs [a-z0-9-]. Arrays MUST be real JSON arrays.`,
    // içerik kalitesi hedefleri:
    `Quality targets:
      - description length: BETWEEN 300 and 600 characters (strict). Natural, vivid, non-repetitive prose.
      - steps: 8–12 for food; 4–6 for beverages.
      - ingredients: 10–20 for food; 2–8 for beverages.
      - tips: at least 3 concise, practical items.`,
    // kategori kuralı
    `The "category" MUST be exactly one of: [${allowedCats}]. If unsure, choose "main-course".`,
    // description yönlendirmesi (tek paragraf, bilgi başlıkları):
    `Description style (single paragraph, no bullets): start with a 1–2 sentence overview,
     add key flavors & textures, cooking method summary, serving suggestions, and optional dietary/occasion note.
     Avoid repeating the title; avoid generic fluff; do not list ingredients here.`,

    `{
      "slug": ${objEmptyAll()},
      "title": ${objEmptyAll()},
      "description": ${objEmptyAll()},
      "category": "",
      "cuisines": [],
      "tags": [ ${objEmptyAll()} ],
      "servings": 4,
      "prepMinutes": 0,
      "cookMinutes": 0,
      "totalMinutes": 0,
      "nutrition": { "calories": 0, "protein": 0, "carbs": 0, "fat": 0, "fiber": 0, "sodium": 0 },
      "dietFlags": [],
      "allergenFlags": [],
      "ingredients": [ { "name": ${objEmptyAll()}, "amount": ${objEmptyAll()} } ],
      "steps": [ { "order": 1, "text": ${objEmptyAll()} } ],
      "tips":  [ { "order": 1, "text": ${objEmptyAll()} } ],
      "images": []
    }`
  ].join("\n");
}
