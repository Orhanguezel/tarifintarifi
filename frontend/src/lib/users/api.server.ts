import { getServerApiBaseAbsolute } from "@/lib/server/http";
import { getLangHeaders } from "@/lib/http";
import type { Me } from "./types";

async function abs(path: string): Promise<string> {
  const base = await getServerApiBaseAbsolute(); // örn: "https://.../api"
  return base.replace(/\/+$/, "") + "/" + String(path).replace(/^\/+/, "");
}

export async function fetchMeServer(locale = "tr", cookie?: string): Promise<Me | null> {
  const url = await abs("users/me");
  const r = await fetch(url, {
    headers: {
      ...getLangHeaders(locale),
      ...(cookie ? { cookie } : {}),
    },
    // cache: "no-store", // istersen ekle
  });
  if (r.status === 401) return null;
  if (!r.ok) throw new Error(`ME failed: ${r.status}`);
  return (await r.json()) as Me;
}

export async function postLogoutServer(locale = "tr", cookie?: string): Promise<boolean> {
  const url = await abs("users/logout");
  const r = await fetch(url, {
    method: "POST",
    headers: {
      ...getLangHeaders(locale),
      ...(cookie ? { cookie } : {}),
    },
  });
  return r.ok;
}
