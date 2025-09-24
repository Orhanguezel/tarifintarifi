import { getServerApiBaseAbsolute } from "@/lib/server/http";
import { buildCommonHeaders } from "@/lib/http";
import { resolveTenant } from "@/lib/server/tenant";
import { normalizeLocale } from "@/lib/server/locale";
import type { SupportedLocale } from "@/types/common";
import type {
  IReferences,
  ReferencesCategory,
  ReferencesListParams,
  ApiEnvelope,
} from "./types";

/** abs("/references") → https://.../api/references */
async function abs(path: string): Promise<string> {
  const base = await getServerApiBaseAbsolute();
  return base.replace(/\/+$/, "") + "/" + String(path).replace(/^\/+/, "");
}

/** SSR/RSC: /references (list) */
export async function fetchReferencesListServer(
  params?: ReferencesListParams,
  cookie?: string
): Promise<IReferences[]> {
  const urlBase = await abs("references");
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

  if (!r.ok) throw new Error(`references list failed: ${r.status}`);
  const j = (await r.json()) as ApiEnvelope<IReferences[]>;
  return j.data ?? [];
}

/** SSR/RSC: /references/slug/:slug (single) */
export async function fetchReferencesBySlugServer(
  slug: string,
  locale?: SupportedLocale,
  cookie?: string
): Promise<IReferences | null> {
  const url = await abs(`references/slug/${encodeURIComponent(slug)}`);
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
  if (!r.ok) throw new Error(`references bySlug failed: ${r.status}`);

  const j = (await r.json()) as ApiEnvelope<IReferences>;
  return j.data ?? null;
}

/** SSR/RSC: /referencescategory (public list) */
export async function fetchReferencesCategoriesServer(
  locale?: SupportedLocale,
  cookie?: string
): Promise<ReferencesCategory[]> {
  const url = await abs("referencescategory");
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

  if (!r.ok) throw new Error(`references categories failed: ${r.status}`);
  const j = (await r.json()) as ApiEnvelope<ReferencesCategory[]>;
  return j.data ?? [];
}
