import { getServerApiBaseAbsolute } from "@/lib/server/http";
import { getLangHeaders } from "@/lib/http";
import type { Me } from "./types";

type Success<T> = { success?: boolean; data?: T } & Partial<T>;

async function abs(path: string): Promise<string> {
  const base = await getServerApiBaseAbsolute();
  return base.replace(/\/+$/, "") + "/" + path.replace(/^\/+/, "");
}

export async function fetchMeServer(locale = "tr", cookie?: string): Promise<Me | null> {
  const url = await abs("users/me");
  const r = await fetch(url, {
    headers: {
      ...getLangHeaders(locale),
      ...(cookie ? { cookie } : {}),
    },
    // SSR’da da cookie forward etmek istersen next/headers’tan alıp buraya geçirirsin
  });
  if (r.status === 401) return null;
  if (!r.ok) throw new Error(`ME failed: ${r.status}`);
  const j = (await r.json()) as Me;
  return j ?? null;
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
