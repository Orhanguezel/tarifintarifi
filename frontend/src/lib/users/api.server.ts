// src/lib/users/api.server.ts
import { getServerApiBaseAbsolute } from "@/lib/server/http";
import { getLangHeaders } from "@/lib/http";
import type { Me } from "./types";

async function abs(path: string): Promise<string> {
  const base = await getServerApiBaseAbsolute(); // örn: "https://.../api"
  return base.replace(/\/+$/, "") + "/" + String(path).replace(/^\/+/, "");
}

/** RSC/SSR: /users/me (GET) */
export async function fetchMeServer(locale = "tr", cookie?: string): Promise<Me | null> {
  const url = await abs("users/me");
  const r = await fetch(url, {
    headers: {
      ...getLangHeaders(locale),
      ...(cookie ? { cookie } : {}),
    },
    // cache: "no-store",
    credentials: "include", // same-origin ise faydalı, abs URL’de cookie header’ı sağlıyoruz
  });
  if (r.status === 401) return null;
  if (!r.ok) throw new Error(`ME failed: ${r.status}`);
  return (await r.json()) as Me;
}

/** RSC/SSR: /users/logout (POST) */
export async function postLogoutServer(locale = "tr", cookie?: string): Promise<boolean> {
  const url = await abs("users/logout");
  const r = await fetch(url, {
    method: "POST",
    headers: {
      ...getLangHeaders(locale),
      ...(cookie ? { cookie } : {}),
    },
    credentials: "include",
  });
  return r.ok;
}
