// src/lib/api.ts
import axios from "axios";

// 🔗 API mutlak origin (örn: https://api.example.com)
// Dev/Prod fark etmeksizin axios bu base'i kullanacak.
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  ""; // boş kalırsa axios aynı origin + path'le çalışır

// CSRF cookie adı (hem FE hem BE aynı env'i okur)
const CSRF_COOKIE =
  process.env.NEXT_PUBLIC_CSRF_COOKIE_NAME || process.env.CSRF_COOKIE_NAME || "tt_csrf";

// Dil: localStorage->navigator->"de"
function getLang(): string {
  if (typeof window === "undefined") return "de";
  const s = localStorage.getItem("lang");
  if (s) return s;
  const nav =
    navigator.language || (navigator as any).userLanguage || "de";
  return String(nav).split("-")[0] || "de";
}

function readCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return m ? decodeURIComponent(m[2]) : "";
}

const API = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // auth + csrf cookie'leri için şart
});

let apiKey: string | null = null;
export const setApiKey = (key: string) => {
  apiKey = key;
};

// İstek interceptor: dil, api-key ve CSRF header ekle
API.interceptors.request.use((config) => {
  config.headers = config.headers || {};

  // Dil
  (config.headers as any)["Accept-Language"] = getLang();
  (config.headers as any)["x-lang"] = getLang();

  // API Key (opsiyonel)
  if (apiKey) (config.headers as any)["X-API-KEY"] = apiKey;

  // CSRF — güvenli olmayan methodlarda header'a cookie'yi yaz
  const method = (config.method || "get").toUpperCase();
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    const token = readCookie(CSRF_COOKIE);
    if (token) {
      (config.headers as any)["X-CSRF-Token"] = token;
    }
  }

  return config;
});

// 401/403'leri sessiz logla (kullanıcıyı zorlamayalım)
API.interceptors.response.use(
  (r) => r,
  (err) => {
    const st = err?.response?.status;
    if (st === 401 || st === 403) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("Auth/CSRF warning:", st, err?.response?.data);
      }
    }
    return Promise.reject(err);
  }
);

export default API;
