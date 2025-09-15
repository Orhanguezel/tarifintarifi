// src/lib/server/http.ts
import { headers as nextHeaders } from "next/headers";

const ensureLeadingSlash = (s: string) => (s.startsWith("/") ? s : `/${s}`);
const stripTrailingSlash = (s: string) => s.replace(/\/+$/, "");

/**
 * SSR/Edge tarafında API base'i absolute üretir:
 * 1) BACKEND_ORIGIN varsa onu kullanır
 * 2) NEXT_PUBLIC_BACKEND_ORIGIN varsa onu kullanır
 * 3) Yoksa: X-Forwarded-* header’larından host’u okuyup same-origin + /api döner
 * 4) Son çare: lokal backend
 */
export async function getServerApiBaseAbsolute(): Promise<string> {
  const apiBasePath = ensureLeadingSlash(process.env.NEXT_PUBLIC_API_BASE || "/api");
  const b1 = stripTrailingSlash(process.env.BACKEND_ORIGIN ?? "");
  const b2 = stripTrailingSlash(process.env.NEXT_PUBLIC_BACKEND_ORIGIN ?? "");
  if (b1) return `${b1}${apiBasePath}`;
  if (b2) return `${b2}${apiBasePath}`;

  const h = await nextHeaders(); // Next 15: Promise
  const proto = h.get("x-forwarded-proto") || "https";
  const host  = h.get("x-forwarded-host") || h.get("host");
  if (host) return `${proto}://${host}${apiBasePath}`;

  // Son çare: lokal backend (sizde 5035)
  return `http://127.0.0.1:5035${apiBasePath}`;
}
