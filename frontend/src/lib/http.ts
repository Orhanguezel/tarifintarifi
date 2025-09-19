// src/lib/http.ts
// ⚠️ Bu dosya client bundle'a girer. Absolute origin KULLANMA!

const ensureLeadingSlash = (s: string) => (s.startsWith("/") ? s : `/${s}`);
const stripTrailingSlash = (s: string) => s.replace(/\/+$/, "");

/** Her zaman sadece PATH döndür (örn: "/api"). */
export function getApiBase(): string {
  const raw = process.env.NEXT_PUBLIC_API_BASE || "/api";
  const base = ensureLeadingSlash(raw);
  return stripTrailingSlash(base) || "/api";
}

export function getLangHeaders(locale: string) {
  return { "Accept-Language": locale, "x-lang": locale };
}

export function getPublicApiKey() {
  return String(process.env.NEXT_PUBLIC_API_KEY || "");
}

/** SSR/RSC için cookie'leri korumak istediğin yerlerde RELATIF `/api` döndür. */
export function getServerApiUrl(path = ""): string {
  const base = (process.env.NEXT_PUBLIC_API_BASE || "/api").replace(/\/+$/, "");
  const p = String(path || "").replace(/^\/+/, "");
  return p ? `${ensureLeadingSlash(base)}/${p}` : ensureLeadingSlash(base);
}
