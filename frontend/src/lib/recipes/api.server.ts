import type { Recipe } from "@/lib/recipes/types";
import { getLangHeaders } from "@/lib/http";
import { getServerApiBaseAbsolute } from "@/lib/server/http";

const API_LIMIT_MAX = 120;
const DEFAULT_TIMEOUT_MS = Number(process.env.RECIPES_PUBLIC_WINDOW_MS ?? 10_000);

type PublicListMeta = {
  page: number; limit: number; total: number; totalPages: number;
  count: number; hasPrev: boolean; hasNext: boolean;
};
type PublicListResponse = { success: boolean; data: Recipe[]; meta: PublicListMeta };

const TAG_VIEW_FIELDS = [
  "slug","slugCanonical","title",
  "images.url","images.thumbnail","images.webp",
  "totalMinutes","servings",
  "nutrition.calories",
  "difficulty","dietFlags","allergenFlags",
  "reactionTotals.like","commentCount","ratingAvg",
  "createdAt","updatedAt"
].join(" ");

type SuccessData<T> = { success: true; data: T; message?: string };

async function buildApiUrl(path: string, params?: Record<string, string | number | undefined>): Promise<URL> {
  const base = await getServerApiBaseAbsolute();
  const url = new URL(path.replace(/^\/+/, ""), base.endsWith("/") ? base : base + "/");
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) url.searchParams.set(k, String(v));
    }
  }
  return url;
}

async function fetchApi(url: URL | string, locale: string, opts?: { revalidate?: number; timeoutMs?: number }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), opts?.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  try {
    return await fetch(typeof url === "string" ? url : url.toString(), {
      headers: getLangHeaders(locale),
      signal: controller.signal,
      ...(opts?.revalidate ? { next: { revalidate: opts.revalidate } } : {}),
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function getRecipeBySlug(locale: string, slug: string, opts?: { revalidate?: number }): Promise<Recipe | null> {
  const url = await buildApiUrl(`recipes/${encodeURIComponent(slug)}`);
  const r = await fetchApi(url, locale, { revalidate: opts?.revalidate });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`Recipe fetch failed: ${r.status} ${url}`);
  const j = (await r.json()) as SuccessData<Recipe>;
  return j?.data ?? null;
}

export async function listRecipesByTag(
  locale: string,
  tagKey: string,
  opts?: { limit?: number; revalidate?: number; hl?: string }
) {
  const envDefault = Number(process.env.NEXT_PUBLIC_TAG_PAGE_LIMIT ?? API_LIMIT_MAX);
  const rawLimit = (opts?.limit ?? envDefault) ?? API_LIMIT_MAX;
  const limit = Math.max(1, Math.min(Number(rawLimit) || API_LIMIT_MAX, API_LIMIT_MAX));

  // Backend hangi adı bekliyorsa yakalasın diye birden çok anahtar gönderiyoruz.
  const url = await buildApiUrl("recipes", {
    hl: opts?.hl,
    tag: tagKey,            // yaygın
    tags: tagKey,           // bazı API'ler çoğul ister
    tagKey: tagKey,         // alternatif
    tagSlug: tagKey,        // alternatif
    slugCanonical: tagKey,  // alternatif
    limit,
    fields: TAG_VIEW_FIELDS,
  });

  const r = await fetchApi(url, locale, { revalidate: opts?.revalidate });
  if (!r.ok) return [];
  const j = (await r.json()) as { success: boolean; data: Recipe[] };
  return Array.isArray(j?.data) ? j.data : [];
}

export async function listRecipesByTagPaged(
  locale: string,
  tagKey: string,
  opts?: { page?: number; limit?: number; hl?: string; revalidate?: number }
): Promise<{ items: Recipe[]; meta: PublicListMeta }> {
  const limit = Math.max(1, Math.min(Number(opts?.limit || 12), 120));
  const page  = Math.max(1, Number(opts?.page || 1));

  const url = await buildApiUrl("recipes", {
    hl: opts?.hl,
    tag: tagKey,
    limit,
    page,
    fields: TAG_VIEW_FIELDS,
  });

  const r = await fetchApi(url, locale, { revalidate: opts?.revalidate });
  if (!r.ok) throw new Error(`Tag list failed: ${r.status} ${url}`);

  const j = (await r.json()) as PublicListResponse;
  return { items: j?.data ?? [], meta: j?.meta ?? {
    page, limit, total: (j?.data ?? []).length, totalPages: 1, count: (j?.data ?? []).length,
    hasPrev: page > 1, hasNext: false
  }};
}
