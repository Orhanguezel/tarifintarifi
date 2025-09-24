import { getServerApiBaseAbsolute } from "@/lib/server/http";
import { buildCommonHeaders } from "@/lib/http";
import { resolveTenant } from "@/lib/server/tenant";
import { normalizeLocale } from "@/lib/server/locale";
import type { Me } from "./types";

async function abs(path: string): Promise<string> {
  const base = await getServerApiBaseAbsolute(); // "https://.../api"
  return base.replace(/\/+$/, "") + "/" + String(path).replace(/^\/+/, "");
}

/** RSC/SSR: /users/me (GET) */
export async function fetchMeServer(locale?: string, cookie?: string): Promise<Me | null> {
  const url = await abs("users/me");
  const tenant = await resolveTenant();
  const l = normalizeLocale(locale);
  const r = await fetch(url, {
    headers: {
      ...buildCommonHeaders(l, tenant),
      ...(cookie ? { cookie } : {}),
    },
    credentials: "include",
  });
  if (r.status === 401) return null;
  if (!r.ok) throw new Error(`ME failed: ${r.status}`);
  return (await r.json()) as Me;
}

/** RSC/SSR: /users/logout (POST) */
export async function postLogoutServer(locale?: string, cookie?: string): Promise<boolean> {
  const url = await abs("users/logout");
  const tenant = await resolveTenant();
  const l = normalizeLocale(locale);
  const r = await fetch(url, {
    method: "POST",
    headers: {
      ...buildCommonHeaders(l, tenant),
      ...(cookie ? { cookie } : {}),
    },
    credentials: "include",
  });
  return r.ok;
}
