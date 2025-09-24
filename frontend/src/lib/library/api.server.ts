import { getServerApiBaseAbsolute } from "@/lib/server/http";
import { buildCommonHeaders } from "@/lib/http";
import { resolveTenant } from "@/lib/server/tenant";
import { normalizeLocale } from "@/lib/server/locale";
import type { SupportedLocale } from "@/types/common";
import type { ILibrary, LibraryCategory, LibraryListParams, ApiEnvelope } from "./types";

/** abs("/library") → https://.../api/library */
async function abs(path: string): Promise<string> {
  const base = await getServerApiBaseAbsolute();
  return base.replace(/\/+$/, "") + "/" + String(path).replace(/^\/+/, "");
}

/** SSR/RSC: /library (list) */
export async function fetchLibraryListServer(
  params?: LibraryListParams,
  cookie?: string
): Promise<ILibrary[]> {
  const urlBase = await abs("library");
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

  if (!r.ok) throw new Error(`library list failed: ${r.status}`);
  const j = (await r.json()) as ApiEnvelope<ILibrary[]>;
  return j.data ?? [];
}

/** SSR/RSC: /library/slug/:slug (single) */
export async function fetchLibraryBySlugServer(
  slug: string,
  locale?: SupportedLocale,
  cookie?: string
): Promise<ILibrary | null> {
  const url = await abs(`library/slug/${encodeURIComponent(slug)}`);
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
  if (!r.ok) throw new Error(`library bySlug failed: ${r.status}`);

  const j = (await r.json()) as ApiEnvelope<ILibrary>;
  return j.data ?? null;
}

/** SSR/RSC: /librarycategory (public list) */
export async function fetchLibraryCategoriesServer(
  locale?: SupportedLocale,
  cookie?: string
): Promise<LibraryCategory[]> {
  const url = await abs("librarycategory");
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

  if (!r.ok) throw new Error(`library categories failed: ${r.status}`);
  const j = (await r.json()) as ApiEnvelope<LibraryCategory[]>;
  return j.data ?? [];
}
