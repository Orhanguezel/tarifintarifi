// src/lib/http.ts
const ensureLeadingSlash = (s: string) => (s.startsWith("/") ? s : `/${s}`);
const ensureNoTrailingSlash = (s: string) => s.replace(/\/+$/, "");

/**
 * İstemci ve sunucu ortak kullanım (CORS durumu NET):
 * - NEXT_PUBLIC_BACKEND_ORIGIN dolu ise: absolute "<origin><base>"
 * - Değilse: relative "<base>" (same-origin proxy/rewrites)
 */
export function getApiBase(): string {
  const base = ensureLeadingSlash(process.env.NEXT_PUBLIC_API_BASE || "/api");
  const explicitOrigin = (process.env.NEXT_PUBLIC_BACKEND_ORIGIN || "").trim();
  if (!explicitOrigin) return base; // same-origin
  return ensureNoTrailingSlash(explicitOrigin) + base;
}

export function getLangHeaders(locale: string) {
  return {
    "Accept-Language": locale,
    "x-lang": locale,
  };
}

export function getPublicApiKey() {
  return String(process.env.NEXT_PUBLIC_API_KEY || "");
}
