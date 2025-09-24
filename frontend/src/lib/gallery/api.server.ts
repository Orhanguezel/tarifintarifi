import { getServerApiBaseAbsolute } from "@/lib/server/http";
import { buildCommonHeaders } from "@/lib/http";
import { resolveTenant } from "@/lib/server/tenant";
import { normalizeLocale } from "@/lib/server/locale";
import type { SupportedLocale } from "@/types/common";
import type {
  IAbout,
  AboutCategory,
  AboutListParams,
  ApiEnvelope,
} from "./types";

/** abs("/about") → https://.../api/about */
async function abs(path: string): Promise<string> {
  const base = await getServerApiBaseAbsolute(); // "https://.../api"
  return base.replace(/\/+$/, "") + "/" + String(path).replace(/^\/+/, "");
}

/** SSR/RSC: /about (list) */
export async function fetchAboutListServer(
  params?: AboutListParams,
  cookie?: string
): Promise<IAbout[]> {
  const urlBase = await abs("about");
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
    cache: "no-store", // liste RSC’de taze kalsın (isteğe göre revalidate param. ile oynanır)
  });

  if (!r.ok) {
    throw new Error(`about list failed: ${r.status}`);
  }
  const j = (await r.json()) as ApiEnvelope<IAbout[]>;
  return j.data ?? [];
}

/** SSR/RSC: /about/slug/:slug (single) */
export async function fetchAboutBySlugServer(
  slug: string,
  locale?: SupportedLocale,
  cookie?: string
): Promise<IAbout | null> {
  const url = await abs(`about/slug/${encodeURIComponent(slug)}`);
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
  if (!r.ok) throw new Error(`about bySlug failed: ${r.status}`);

  const j = (await r.json()) as ApiEnvelope<IAbout>;
  return j.data ?? null;
}

/** SSR/RSC: /aboutcategory (public list) */
export async function fetchAboutCategoriesServer(
  locale?: SupportedLocale,
  cookie?: string
): Promise<AboutCategory[]> {
  const url = await abs("aboutcategory");
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

  if (!r.ok) throw new Error(`about categories failed: ${r.status}`);

  const j = (await r.json()) as ApiEnvelope<AboutCategory[]>;
  return j.data ?? [];
}
