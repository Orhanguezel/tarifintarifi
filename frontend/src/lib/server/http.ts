import { headers as nextHeaders } from "next/headers";
import { ensureLeadingSlash, stripTrailingSlash } from "@/lib/strings";

/**
 * SSR/Edge’de absolute API base:
 * 1) NEXT_PUBLIC_API_URL
 * 2) BACKEND_ORIGIN + NEXT_PUBLIC_API_BASE
 * 3) NEXT_PUBLIC_BACKEND_ORIGIN + NEXT_PUBLIC_API_BASE
 * 4) X-Forwarded-* same-origin + /api
 * 5) http://127.0.0.1:5035/api
 */
export async function getServerApiBaseAbsolute(): Promise<string> {
  const absolute = stripTrailingSlash(process.env.NEXT_PUBLIC_API_URL ?? "");
  if (absolute) return absolute;

  const apiBasePath = ensureLeadingSlash(process.env.NEXT_PUBLIC_API_BASE || "/api");
  const b1 = stripTrailingSlash(process.env.BACKEND_ORIGIN ?? "");
  const b2 = stripTrailingSlash(process.env.NEXT_PUBLIC_BACKEND_ORIGIN ?? "");
  if (b1) return `${b1}${apiBasePath}`;
  if (b2) return `${b2}${apiBasePath}`;

  const h = await nextHeaders();
  const xfHost = (h.get("x-forwarded-host") || "").split(",")[0].trim();
  const host = xfHost || h.get("host") || "";
  const proto = (h.get("x-forwarded-proto") || "https").split(",")[0].trim();

  if (host) return `${proto}://${host}${apiBasePath}`;
  return `http://127.0.0.1:5035${apiBasePath}`;
}
