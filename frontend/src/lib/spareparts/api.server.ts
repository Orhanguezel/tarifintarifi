import { getServerApiBaseAbsolute } from "@/lib/server/http";
import { buildCommonHeaders } from "@/lib/http";
import { resolveTenant } from "@/lib/server/tenant";
import { normalizeLocale } from "@/lib/server/locale";
import type { SupportedLocale } from "@/types/common";
import type {
  ISparepart,
  SparepartCategory,
  SparepartsListParams,
  ApiEnvelope,
} from "./types";

/** abs("/sparepart") → https://.../api/sparepart */
async function abs(path: string): Promise<string> {
  const base = await getServerApiBaseAbsolute();
  return base.replace(/\/+$/, "") + "/" + String(path).replace(/^\/+/, "");
}

/** SSR/RSC: /sparepart (list) */
export async function fetchSparepartsListServer(
  params?: SparepartsListParams,
  cookie?: string
): Promise<ISparepart[]> {
  const urlBase = await abs("sparepart");
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

  if (!r.ok) throw new Error(`sparepart list failed: ${r.status}`);
  const j = (await r.json()) as ApiEnvelope<ISparepart[]>;
  return j.data ?? [];
}

/** SSR/RSC: /sparepart/slug/:slug (single) */
export async function fetchSparepartBySlugServer(
  slug: string,
  locale?: SupportedLocale,
  cookie?: string
): Promise<ISparepart | null> {
  const url = await abs(`sparepart/slug/${encodeURIComponent(slug)}`);
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
  if (!r.ok) throw new Error(`sparepart bySlug failed: ${r.status}`);

  const j = (await r.json()) as ApiEnvelope<ISparepart>;
  return j.data ?? null;
}

/** SSR/RSC: /sparepartcategory (public list) */
export async function fetchSparepartCategoriesServer(
  locale?: SupportedLocale,
  cookie?: string
): Promise<SparepartCategory[]> {
  const url = await abs("sparepartcategory");
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

  if (!r.ok) throw new Error(`sparepart categories failed: ${r.status}`);
  const j = (await r.json()) as ApiEnvelope<SparepartCategory[]>;
  return j.data ?? [];
}
