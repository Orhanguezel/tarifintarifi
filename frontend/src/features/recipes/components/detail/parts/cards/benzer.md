harika — şimdi “etiket kesişimi + akıllı puanlama” yapan, daha isabetli bir `useRelatedByTags` hazırladım. Etiket ortaklığı hâlâ ana sinyal; buna ek olarak:

* aynı kategori bonusu
* mutfak (cuisines) kesişimi
* süre yakınlığı (±dk)
* kalori yakınlığı (±kcal)
* malzeme benzerliği (Jaccard; ingredient adlarından)
* popülerlik (rating + like)
* diyet uyumu (ör. base vegan ise aday vegan değilse penalti)

Aşağıdaki hook’u mevcut dosyanın yerine koyun (fields paramı **göndermiyoruz**; API tam doküman dönsün ki malzemeler, mutfak, besin değerleri vs. gelsin):

```ts
"use client";

import { useEffect, useMemo, useState } from "react";
import type { Recipe } from "@/lib/recipes/types";
import type { SupportedLocale } from "@/types/common";
import { getApiBase, getLangHeaders } from "@/lib/http";

/* ----- helpers ----- */

// tag çıkarımı (orijinal label)
function extractTags(r: Recipe, locale: SupportedLocale): string[] {
  const raw = (r?.tags || []) as any[];
  const vals = raw
    .map((t) => {
      if (!t) return "";
      const loc = t?.[locale];
      const en  = t?.en || t?.EN;
      const first = Object.values(t || {}).find(
        (v) => typeof v === "string" && String(v).trim()
      );
      return String(loc || en || (first as string) || "").trim();
    })
    .filter(Boolean);
  return Array.from(new Set(vals));
}

// normalize (eşleşme/tokens)
const norm = (s: string) =>
  String(s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

// ingredient -> token set (kısa/değer/ölçüleri at)
const STOP = new Set([
  "gr","g","kg","ml","l","adet","su","bardak","tatlı","çay","yemek","kaşığı","paket",
  "tsp","tbsp","cup","cups","teaspoon","tablespoon","piece","pieces"
]);
function ingredientTokens(r: Recipe, locale: SupportedLocale): Set<string> {
  const toks = new Set<string>();
  const list = (r?.ingredients || []) as any[];
  for (const ing of list) {
    const name = (typeof ing?.name === "string"
      ? ing.name
      : ing?.name?.[locale] || ing?.name?.tr || Object.values(ing?.name || {})[0]) as string | undefined;
    if (!name) continue;
    for (const w of name.split(/[^a-zA-ZğüşöçıİĞÜŞÖÇ0-9]+/g)) {
      const t = norm(w);
      if (!t || t.length < 3 || STOP.has(t)) continue;
      toks.add(t);
    }
  }
  return toks;
}

const API_BASE = (getApiBase() || "/api").replace(/\/+$/, "") + "/";
type ApiListResp = { success: boolean; data: Recipe[] };

// yakınlık -> 0..1 (delta küçüldükçe 1’e yaklaşsın)
const closeness = (delta: number, scale: number) =>
  1 / (1 + Math.max(0, delta) / Math.max(1, scale));

// diyet uyumu (base -> candidate)
function dietMultiplier(base: string[] = [], cand: string[] = []) {
  const b = new Set(base);
  const c = new Set(cand);
  // base vegan ise aday vegan değilse ağır ceza
  if (b.has("vegan") && !c.has("vegan")) return 0.25;
  // base vejetaryen ise aday en az vejetaryen/vegan olmalı
  if (b.has("vegetarian") && !(c.has("vegetarian") || c.has("vegan"))) return 0.6;
  // base gluten-free ise aday değilse
  if (b.has("gluten-free") && !c.has("gluten-free")) return 0.6;
  // base lactose-free ise aday değilse
  if (b.has("lactose-free") && !c.has("lactose-free")) return 0.7;
  return 1;
}

/* ----- main hook ----- */

/** Etiket kesişimine dayalı + çok-sinyalli puanlama */
export function useRelatedByTags(
  locale: SupportedLocale,
  recipe: Recipe,
  opts?: { limit?: number; perTagLimit?: number }
) {
  const [items, setItems] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);

  const tags = useMemo(() => extractTags(recipe, locale), [recipe, locale]);
  const tagsNorm = useMemo(() => tags.map(norm), [tags]);

  const baseMinutes = Number(recipe.totalMinutes ?? (Number((recipe as any).prepMinutes) || 0) + (Number((recipe as any).cookMinutes) || 0)) || undefined;
  const baseKcal = Number((recipe as any)?.nutrition?.calories ?? (recipe as any)?.calories) || undefined;
  const baseDiet = (recipe as any)?.dietFlags || [];
  const baseCategory = norm((recipe as any)?.category || "");
  const baseCuisines = new Set(((recipe as any)?.cuisines || []).map(norm));
  const baseIng = useMemo(() => ingredientTokens(recipe, locale), [recipe, locale]);

  const limit = Math.max(1, opts?.limit ?? 6);
  const perTagLimit = Math.max(2, opts?.perTagLimit ?? 10);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!tags.length) { setItems([]); return; }
      setLoading(true);

      try {
        // Fazla istek olmasın diye ilk 3 etikete sınırla
        const topTags = tags.slice(0, 3);
        const urls = topTags.map((hl) => {
          const qs = new URLSearchParams({
            hl,                 // BE: label öncelikli
            limit: String(perTagLimit),
            // fields YOK -> tam doküman (ingredients, cuisines vs. lazım)
          });
          return `${API_BASE}recipes?${qs.toString()}`;
        });

        const headers = getLangHeaders(locale);
        const responses = await Promise.all(
          urls.map((u) =>
            fetch(u, { headers })
              .then((r) => (r.ok ? r.json() : null))
              .catch(() => null)
          )
        );

        const pool = new Map<string, { r: Recipe; score: number }>();

        for (const resp of responses) {
          const arr: Recipe[] = (resp as ApiListResp)?.data || [];
          for (const rx of arr) {
            // kendisini ele
            const isSelf =
              (rx as any)._id === (recipe as any)._id ||
              rx.slugCanonical === recipe.slugCanonical;
            if (isSelf) continue;

            // gerekli minimum alanlar (başlık/slug)
            const hasTitle =
              (typeof (rx as any).title === "string" && (rx as any).title.trim()) ||
              (rx as any).title?.tr ||
              Object.values((rx as any).title || {}).some((v: any) => typeof v === "string" && v.trim());
            const hasSlug = Boolean((rx as any).slugCanonical || (rx as any).slug);
            if (!hasTitle || !hasSlug) continue;

            // --- sinyaller ---
            const rxTags = extractTags(rx, locale).map(norm);
            const tagOverlap = rxTags.filter((t) => tagsNorm.includes(t)).length;

            const rxCategory = norm((rx as any)?.category || "");
            const sameCategory = baseCategory && rxCategory && baseCategory === rxCategory ? 1 : 0;

            const rxCuisines = new Set(((rx as any)?.cuisines || []).map(norm));
            let cuisineOverlap = 0;
            for (const c of rxCuisines) if (baseCuisines.has(c)) cuisineOverlap++;

            const rxMinutes = Number((rx as any).totalMinutes ?? (Number((rx as any).prepMinutes) || 0) + (Number((rx as any).cookMinutes) || 0)) || undefined;
            const timeClose = (baseMinutes && rxMinutes) ? closeness(Math.abs(baseMinutes - rxMinutes), 10) : 0;

            const rxKcal = Number((rx as any)?.nutrition?.calories ?? (rx as any)?.calories) || undefined;
            const kcalClose = (baseKcal && rxKcal) ? closeness(Math.abs(baseKcal - rxKcal), 100) : 0;

            const rxDiet = (rx as any)?.dietFlags || [];
            const dietMult = dietMultiplier(baseDiet, rxDiet);

            const rxIng = ingredientTokens(rx, locale);
            let ingJaccard = 0;
            if (baseIng.size && rxIng.size) {
              let inter = 0;
              for (const t of rxIng) if (baseIng.has(t)) inter++;
              const uni = baseIng.size + rxIng.size - inter;
              ingJaccard = uni > 0 ? inter / uni : 0;
            }

            const rating = Number((rx as any).ratingAvg || 0);
            const likes = Number((rx as any).reactionTotals?.like || 0);
            const popularity = rating * 12 + Math.min(likes, 500) * 0.4;

            // --- toplam skor (ağırlıklar) ---
            let score =
              tagOverlap * 120 +
              ingJaccard * 150 +
              cuisineOverlap * 35 +
              sameCategory * 45 +
              timeClose * 25 +
              kcalClose * 18 +
              popularity;

            score *= dietMult; // diyet uyumu katsayısı

            // havuz
            const key = (rx as any)._id || rx.slugCanonical || JSON.stringify(rx);
            const prev = pool.get(key);
            if (!prev || prev.score < score) pool.set(key, { r: rx, score });
          }
        }

        const combined = Array.from(pool.values())
          .sort((a, b) => b.score - a.score)
          .map((x) => x.r)
          .slice(0, limit);

        if (!cancelled) setItems(combined);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => { cancelled = true; };
    // deps
  }, [
    locale,
    JSON.stringify(tags),
    (recipe as any)._id,
    recipe.slugCanonical,
    baseMinutes,
    baseKcal,
    baseCategory,
    JSON.stringify(Array.from(baseCuisines)),
    JSON.stringify(Array.from(baseIng)),
  ]);

  return { items, loading };
}
```

Bu sürüm:

* **tek endpoint** ve **az sayıda istek** (en fazla 3 tag)
* alan kısıtlaması vermediğimiz için (fields), başlık/slug/malzemeler %100 geliyor
* skoru çeşitlendirip daha tutarlı sonuç veriyor
* vegan/vejetaryen gibi **diyet uyumsuzlarını geri plana** itiyor

İstersen, aynı mantığı kategori fallback’ine de entegre eden küçük bir `useRelatedHybrid` yazarım (tag sonuçları yoksa otomatik kategoriye geçip aynı puanlayıcıyla sıralar).
