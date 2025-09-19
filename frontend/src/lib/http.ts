// src/lib/http.ts
// ⚠️ Bu dosya client bundle'a girer.

const ensureLeadingSlash = (s: string) => (s.startsWith("/") ? s : `/${s}`);
const stripTrailingSlash = (s: string) => s.replace(/\/+$/, "");

/**
 * Public fetch'lerde kullanılacak path-base.
 * RTK Query veya fetch ile aynı origin'e istek atıyorsan /api yeterli.
 * (Axios zaten NEXT_PUBLIC_API_URL ile absolute kullanıyor.)
 */
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

/** SSR/RSC için relative URL üret (cookie korumak için same-origin iyi olur). */
export function getServerApiUrl(path = ""): string {
  const base = (process.env.NEXT_PUBLIC_API_BASE || "/api").replace(/\/+$/, "");
  const p = String(path || "").replace(/^\/+/, "");
  return p ? `${ensureLeadingSlash(base)}/${p}` : ensureLeadingSlash(base);
}

/* ===== CSRF (client only) ===== */

function readCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return m ? decodeURIComponent(m[2]) : "";
}

/** Cookie veya meta'dan olası CSRF token'ı getirir. */
export function getClientCsrfToken():
  | { token: string; source: "meta" | "cookie" | "none" }
  | undefined {
  if (typeof document === "undefined") return { token: "", source: "none" };

  const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
  if (meta?.content) return { token: meta.content, source: "meta" };

  const cookieName =
    process.env.NEXT_PUBLIC_CSRF_COOKIE_NAME ||
    process.env.CSRF_COOKIE_NAME ||
    "tt_csrf";

  const v = readCookie(cookieName);
  if (v) return { token: v.split("|")[0] || v, source: "cookie" };

  return { token: "", source: "none" };
}
