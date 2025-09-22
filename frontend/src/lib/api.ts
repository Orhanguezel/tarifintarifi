// src/lib/api.ts
import axios, {
  type AxiosRequestConfig,
  type AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";

/** ===== Base URL seçimi =====
 *  - Mutlak verildiyse onu kullan
 *  - Boşsa same-origin "/api" (Next rewrite ile uyumlu)
 */
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "").trim() || "/api";

/** CSRF cookie adı FE/BE uyumlu */
const CSRF_COOKIE =
  process.env.NEXT_PUBLIC_CSRF_COOKIE_NAME ||
  process.env.CSRF_COOKIE_NAME ||
  "tt_csrf";

/** Dili belirle (localStorage > navigator > 'tr') */
function getLang(): string {
  if (typeof window === "undefined") return "tr";
  const s = localStorage.getItem("lang");
  if (s) return s;
  const nav = navigator.language || (navigator as any).userLanguage || "tr";
  return String(nav).split("-")[0] || "tr";
}

/** Cookie oku (basit ve güvenli) */
function readCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : "";
}

/** CSRF cookie'sini üretmek için opsiyonel "ısıtma" (GET) */
async function ensureCsrfCookie(): Promise<void> {
  const base = API_BASE_URL.replace(/\/+$/, "");
  // Önce /csrf varsa onu dene; yoksa /ping gibi herhangi bir GET
  const tryUrls = [`${base}/csrf`, `${base}/ping`];
  for (const u of tryUrls) {
    try {
      await fetch(u, { credentials: "include", method: "GET" });
      return;
    } catch {
      // sıradakini dene
    }
  }
}

/** Tekil Axios instance */
const API = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // httpOnly cookie’ler için şart
});

// Public API key opsiyonel olarak tutulur
let apiKey: string | null = null;
export const setApiKey = (key: string) => {
  apiKey = key;
};

/** ====== Request Interceptor ====== */
API.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  config.headers = config.headers ?? {};

  // Dil başlıkları
  (config.headers as any)["Accept-Language"] = getLang();
  (config.headers as any)["x-lang"] = getLang();

  // Bazı altyapılar için faydalı işaret
  (config.headers as any)["X-Requested-With"] = "XMLHttpRequest";

  // API Key (opsiyonel)
  if (apiKey) (config.headers as any)["X-API-KEY"] = apiKey;

  // CSRF — güvenli olmayan metodlarda header'a cookie’yi yaz
  const method = (config.method || "get").toUpperCase();
  const unsafe = !["GET", "HEAD", "OPTIONS"].includes(method);
  if (unsafe && !config.csrfDisabled) {
    const token = readCookie(CSRF_COOKIE);
    if (token) (config.headers as any)["X-CSRF-Token"] = token;
  }

  return config;
});

/** ====== Response Interceptor ======
 * - 403 (CSRF) → bir kez CSRF ısıtma + retry
 * - 401 (opsiyonel) → refresh + retry (isteğe bağlı, kapalı)
 */
API.interceptors.response.use(
  (r) => r,
  async (err: AxiosError<any>) => {
    const cfg = (err.config || {}) as AxiosRequestConfig;
    const status = err.response?.status;

    // --- 403 CSRF: tek seferlik otomatik düzeltme dene ---
    if (status === 403 && !cfg.__retriedOnce && !cfg.csrfDisabled) {
      try {
        await ensureCsrfCookie();
        cfg.__retriedOnce = true;
        return API.request(cfg);
      } catch {
        // no-op
      }
    }

    // --- 401 UNAUTHORIZED: refresh → retry (opsiyonel) ---
    // Eğer refresh uçun varsa aşağıyı aç:
    // if (status === 401 && !cfg.__retriedOnce) {
    //   try {
    //     await API.post("/users/refresh"); // same-origin, cookie ile
    //     cfg.__retriedOnce = true;
    //     return API.request(cfg);
    //   } catch {
    //     // refresh de başarısız
    //   }
    // }

    if (process.env.NODE_ENV !== "production" && (status === 401 || status === 403)) {
      // eslint-disable-next-line no-console
      console.warn("Auth/CSRF warning:", status, err?.response?.data);
    }
    return Promise.reject(err);
  }
);

export default API;

/** ===== Yardımcı kısayollar =====
 *  CSRF gereksiz ise endpoint çağrısında: { csrfDisabled: true } gönder.
 */

export function getJson<T = any>(url: string, cfg?: AxiosRequestConfig) {
  return API.get<T>(url, cfg);
}

export function postJson<T = any>(url: string, data?: any, cfg?: AxiosRequestConfig) {
  return API.post<T>(url, data, {
    ...(cfg || {}),
    headers: { "Content-Type": "application/json", ...(cfg?.headers || {}) },
  });
}

export function putJson<T = any>(url: string, data?: any, cfg?: AxiosRequestConfig) {
  return API.put<T>(url, data, {
    ...(cfg || {}),
    headers: { "Content-Type": "application/json", ...(cfg?.headers || {}) },
  });
}

export function patchJson<T = any>(url: string, data?: any, cfg?: AxiosRequestConfig) {
  return API.patch<T>(url, data, {
    ...(cfg || {}),
    headers: { "Content-Type": "application/json", ...(cfg?.headers || {}) },
  });
}

export function del<T = any>(url: string, cfg?: AxiosRequestConfig) {
  return API.delete<T>(url, cfg);
}
