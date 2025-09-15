// src/lib/recipes/categories.ts

/** Model/AI tarafıyla hizalı kategori anahtarları */
export const AI_CATEGORY_KEYS = [
  "breakfast","soup","salad","appetizer","snack","sandwich-wrap","main-course","side-dish",
  "pasta","rice-pilaf","legumes","stew","grill-bbq","roast-bake","seafood","meat","chicken",
  "pastry","bread","pizza","dessert","cake","cookies","pudding","sauce-dip",
  "drink","hot-drink","cold-drink","tea","coffee","smoothie","juice"
] as const;

export type AICategoryKey = (typeof AI_CATEGORY_KEYS)[number];

const KEY_SET: ReadonlySet<string> = new Set<string>([...AI_CATEGORY_KEYS]);

/** Küçük normalize: lower, diacritics sil, boşluk->- , ascii dışı temizle */
function normalizeBasic(v: string): string {
  // Bazı ortamlarda String.prototype.normalize olmayabilir; guard ekleyelim
  const lower = String(v ?? "").toLowerCase();
  const normalized = typeof lower.normalize === "function" ? lower.normalize("NFKD") : lower;
  return normalized
    .replace(/[\u0300-\u036f]/g, "") // diacritics
    .replace(/[^a-z0-9\s-]/g, "")    // ascii olmayanları temizle
    .replace(/\s+/g, "-")            // boşluklar -> -
    .replace(/-+/g, "-")             // çoklu - tek -
    .replace(/^-|-$/g, "");          // baş/son - temizle
}

/** Sık karşılaşılan takma adları resmi key'lere eşle */
const ALIASES: Record<string, AICategoryKey> = {
  bbq: "grill-bbq",
  barbecue: "grill-bbq",
  grill: "grill-bbq",
  wraps: "sandwich-wrap",
  wrap: "sandwich-wrap",
  sandwich: "sandwich-wrap",
  main: "main-course",
  entree: "main-course",
  side: "side-dish",
  rice: "rice-pilaf",
  pilaf: "rice-pilaf",
  bean: "legumes",
  beans: "legumes",
  legume: "legumes",
  stewpot: "stew",
  fish: "seafood",
  "sea-food": "seafood",
  beef: "meat",
  lamb: "meat",
  poultry: "chicken",
  "pastry-shop": "pastry",
  cakees: "cake", // olası yazım hatası
  biscuit: "cookies",
  biscuites: "cookies",
  "pudding-dessert": "pudding",
  dip: "sauce-dip",
  sauces: "sauce-dip",
  beverages: "drink",
  cold: "cold-drink",
  hot: "hot-drink",
  tisane: "tea",
  espresso: "coffee",
  shake: "smoothie",
  nectars: "juice",
} as const;

/** UI ikonları (bilinmeyen için fallback "🏷️") */
const CATEGORY_ICON_ENTRIES: Array<[AICategoryKey, string]> = [
  ["breakfast", "🍳"],
  ["soup", "🍲"],
  ["salad", "🥗"],
  ["appetizer", "🥟"],
  ["snack", "🥨"],
  ["sandwich-wrap", "🥪"],
  ["main-course", "🍽️"],
  ["side-dish", "🥔"],
  ["pasta", "🍝"],
  ["rice-pilaf", "🍚"],
  ["legumes", "🫘"],
  ["stew", "🍲"],
  ["grill-bbq", "🍖"],
  ["roast-bake", "🍗"],
  ["seafood", "🐟"],
  ["meat", "🥩"],
  ["chicken", "🍗"],
  ["pastry", "🥐"],
  ["bread", "🍞"],
  ["pizza", "🍕"],
  ["dessert", "🍰"],
  ["cake", "🎂"],
  ["cookies", "🍪"],
  ["pudding", "🍮"],
  ["sauce-dip", "🫙"],
  ["drink", "🥤"],
  ["hot-drink", "☕️"],
  ["cold-drink", "🧊"],
  ["tea", "🍵"],
  ["coffee", "☕️"],
  ["smoothie", "🥤"],
  ["juice", "🧃"],
];

export const CATEGORY_ICON: ReadonlyMap<AICategoryKey, string> =
  new Map<AICategoryKey, string>(CATEGORY_ICON_ENTRIES);

/** Girilen değeri resmi kategori anahtarına çevir (eşleşmezse null) */
export function normalizeCategoryKey(input: string | null | undefined): AICategoryKey | null {
  const s = normalizeBasic(String(input ?? ""));
  if (!s) return null;
  if (KEY_SET.has(s)) return s as AICategoryKey;
  const mapped = ALIASES[s as keyof typeof ALIASES];
  return (mapped as AICategoryKey | undefined) ?? null;
}

/** İkona kolay erişim (normalize + fallback) */
export function getCategoryIcon(input: string | null | undefined): string {
  const key = normalizeCategoryKey(input);
  return (key && CATEGORY_ICON.get(key)) || "🏷️";
}
