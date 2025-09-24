import { getServerApiBaseAbsolute } from "@/lib/server/http";
import { buildCommonHeaders } from "@/lib/http";
import { resolveTenant } from "@/lib/server/tenant";
import { normalizeLocale } from "@/lib/server/locale";
import type { SupportedLocale } from "@/types/common";
import type { INews, NewsCategory, NewsListParams, ApiEnvelope } from "./types";

/** abs("/news") → https://.../api/news */
async function abs(path: string): Promise<string> {
  const base = await getServerApiBaseAbsolute();
  return base.replace(/\/+$/, "") + "/" + String(path).replace(/^\/+/, "");
}

/** SSR/RSC: /news (list) */
export async function fetchNewsListServer(
  params?: NewsListParams,
  cookie?: string
): Promise<INews[]> {
  const urlBase = await abs("news");
  const url = new URL(urlBase);

  if (params?.page) url.searchParams.set("page", String(params.page));
  if (params?.limit) url.searchParams.set("limit", String(params.limit));
  if (params?.categorySlug) url.searchParams.set("category", params.categorySlug);
  if (params?.q) url.searchParams.set("q", params.q);
  if (params?.sort) url.searchParams.set("sort", params.sort);

  const tenant = await resolveTenant();
  const l = normalizeLocale(params?.locale as SupportedLocale | undefined);

  const r = await fetch(url.toString(), {
    headers: {
      ...buildCommonHeaders(l, tenant),
      ...(cookie ? { cookie } : {}),
    },
    credentials: "include",
    cache: "no-store",
  });

  if (!r.ok) throw new Error(`news list failed: ${r.status}`);
  const j = (await r.json()) as ApiEnvelope<INews[]>;
  return j.data ?? [];
}

/** SSR/RSC: /news/slug/:slug (single) */
export async function fetchNewsBySlugServer(
  slug: string,
  locale?: SupportedLocale,
  cookie?: string
): Promise<INews | null> {
  const url = await abs(`news/slug/${encodeURIComponent(slug)}`);
  const tenant = await resolveTenant();
  const l = normalizeLocale(locale);

  const r = await fetch(url, {
    headers: {
      ...buildCommonHeaders(l, tenant),
      ...(cookie ? { cookie } : {}),
    },
    credentials: "include",
    cache: "no-store",
  });

  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`news bySlug failed: ${r.status}`);

  const j = (await r.json()) as ApiEnvelope<INews>;
  return j.data ?? null;
}

/** SSR/RSC: /newscategory (public list) */
export async function fetchNewsCategoriesServer(
  locale?: SupportedLocale,
  cookie?: string
): Promise<NewsCategory[]> {
  const url = await abs("newscategory");
  const tenant = await resolveTenant();
  const l = normalizeLocale(locale);

  const r = await fetch(url, {
    headers: {
      ...buildCommonHeaders(l, tenant),
      ...(cookie ? { cookie } : {}),
    },
    credentials: "include",
    cache: "no-store",
  });

  if (!r.ok) throw new Error(`news categories failed: ${r.status}`);
  const j = (await r.json()) as ApiEnvelope<NewsCategory[]>;
  return j.data ?? [];
}
