// Kategoriler artik sabit degil: serbest string.
// UI istiyorsa yine sözlükle çevirebilir.
// /home/orhan/Dokumente/tariftarif/backend/src/modules/recipes/categories.ts
export type RecipeCategoryKey = string;

/** Girdi ne olursa olsun temiz bir kategori anahtarı döndürür. Boşsa undefined. */
export function normalizeCategoryKey(v: unknown): RecipeCategoryKey | undefined {
  if (v == null) return undefined;
  const raw = String(v).trim();
  if (!raw) return undefined;
  // basit slug temizlik: boşluk -> -, küçük harf, temel ascii
  return raw
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
