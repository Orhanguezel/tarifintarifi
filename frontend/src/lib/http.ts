import { ensureLeadingSlash, stripTrailingSlash, Locale } from "./strings";
import { getEnvTenant } from "./config";

/** /api tabanı (same-origin default) */
export function getApiBase(): string {
  const raw = process.env.NEXT_PUBLIC_API_BASE || "/api";
  const base = ensureLeadingSlash(raw);
  return stripTrailingSlash(base) || "/api";
}

/** Ortak başlık üretimi – TEK NOKTA
 *  - locale: 'de' gibi
 *  - tenant: verilmezse env’den alınır
 */
export function buildCommonHeaders(locale: string | Locale, tenant?: string) {
  const l = String(locale || "de").split("-")[0].toLowerCase();
  const t = (tenant || getEnvTenant()).toLowerCase();
  return { "Accept-Language": l, "x-lang": l, "X-Tenant": t };
}

/** Client’ta CSRF cookie oku */
function readCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const re = new RegExp(`(?:^|;\\s*)${name}=([^;]*)`);
  const m = document.cookie.match(re);
  return m ? decodeURIComponent(m[1]) : "";
}

/** Client CSRF token (meta > cookie) */
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
  if (v) return { token: (v.split("|")[0] || v), source: "cookie" };
  return { token: "", source: "none" };
}

/** RSC/SSR için same-origin relative URL */
export function getServerApiUrl(path = ""): string {
  const base = (process.env.NEXT_PUBLIC_API_BASE || "/api").replace(/\/+$/, "");
  const p = String(path || "").replace(/^\/+/, "");
  return p ? `${ensureLeadingSlash(base)}/${p}` : ensureLeadingSlash(base);
}
