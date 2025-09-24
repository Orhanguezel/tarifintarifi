import axios, {
  type AxiosRequestConfig,
  type AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";
import { getApiBase, getClientCsrfToken, buildCommonHeaders } from "./http";
import { getEnvTenant } from "./config";

/** Base URL: absolute varsa onu kullan, yoksa /api */
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "").trim() || getApiBase();

/** Dil tespiti (client) */
function getLang(): string {
  if (typeof window === "undefined") return "de";
  try { const s = localStorage.getItem("lang"); if (s) return s; } catch {}
  const nav = (typeof navigator !== "undefined" && (navigator.language || (navigator as any).userLanguage)) || "de";
  return String(nav).split("-")[0].toLowerCase() || "de";
}

/** CSRF cookie adı */
const CSRF_COOKIE =
  process.env.NEXT_PUBLIC_CSRF_COOKIE_NAME ||
  process.env.CSRF_COOKIE_NAME ||
  "tt_csrf";

/** CSRF ısıtma */
async function ensureCsrfCookie(): Promise<void> {
  const base = API_BASE_URL.replace(/\/+$/, "");
  const tryUrls = [`${base}/admin/recipes/csrf`, `${base}/csrf`, `${base}/ping`];
  for (const u of tryUrls) {
    try { await fetch(u, { credentials: "include", method: "GET" }); return; } catch {}
  }
}

/** Tekil Axios instance */
const API = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Opsiyonel public API key
let apiKey: string | null = null;
export const setApiKey = (key: string) => { apiKey = key; };

/** Request interceptor: dil + tenant + csrf */
API.interceptors.request.use((config: InternalAxiosRequestConfig & { csrfDisabled?: boolean }) => {
  config.headers = config.headers ?? {};
  // Dil & Tenant (tek yerden)
  const baseHeaders = buildCommonHeaders(getLang(), getEnvTenant());
  Object.assign(config.headers as any, baseHeaders, { "X-Requested-With": "XMLHttpRequest" });

  // API Key (opsiyonel)
  if (apiKey) (config.headers as any)["X-API-KEY"] = apiKey;

  // CSRF (unsafe metodlarda)
  const method = (config.method || "get").toUpperCase();
  const unsafe = !["GET", "HEAD", "OPTIONS"].includes(method);
  if (unsafe && !config.csrfDisabled) {
    const metaOrCookie = getClientCsrfToken();
    const token = metaOrCookie?.token;
    if (token) (config.headers as any)["X-CSRF-Token"] = token;
  }
  return config;
});

/** Response interceptor: 403 → ısıtma + 1 kez retry */
API.interceptors.response.use(
  (r) => r,
  async (err: AxiosError<any>) => {
    const cfg = (err.config || {}) as (AxiosRequestConfig & { __retriedOnce?: boolean; csrfDisabled?: boolean });
    const status = err.response?.status;

    if (status === 403 && !cfg.__retriedOnce && !cfg.csrfDisabled) {
      try {
        await ensureCsrfCookie();
        cfg.__retriedOnce = true;
        return API.request(cfg);
      } catch {}
    }

    if (process.env.NODE_ENV !== "production" && (status === 401 || status === 403)) {
      // eslint-disable-next-line no-console
      console.warn("Auth/CSRF warning:", status, err?.response?.data);
    }
    return Promise.reject(err);
  }
);

export default API;

/* ---- Kısayollar ---- */
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
