// src/core/utils/cookieUtils.ts
import { Response } from "express";

const isProd = process.env.NODE_ENV === "production";
export const ACCESS_COOKIE = process.env.COOKIE_NAME || "accessToken";
export const CSRF_COOKIE   = process.env.CSRF_COOKIE_NAME || "tt_csrf";

const base = {
  httpOnly: true,
  secure: isProd || process.env.COOKIE_SECURE === "true",
  sameSite: isProd ? ("none" as const) : ("lax" as const),
  path: "/",
};

export function setTokenCookie(res: Response, token: string) {
  // 30 gün yerine token’ın exp süresini kullanmak istiyorsan maxAge vermeyebilirsin.
  const maxAge = Number(process.env.COOKIE_MAX_AGE_MS || 7 * 24 * 60 * 60 * 1000);
  res.cookie(ACCESS_COOKIE, token, { ...base, maxAge });
}

export function clearTokenCookie(res: Response) {
  res.clearCookie(ACCESS_COOKIE, { path: "/", httpOnly: true, sameSite: base.sameSite, secure: base.secure });
}

// opsiyonel CSRF (double submit)
export function setCsrfCookie(res: Response) {
  const val = cryptoRandom();
  // CSRF cookie httpOnly DEĞİL (FE header’a koyacak)
  res.cookie(CSRF_COOKIE, val, { ...base, httpOnly: false, maxAge: 2 * 60 * 60 * 1000 });
  return val;
}
export function clearCsrfCookie(res: Response) {
  res.clearCookie(CSRF_COOKIE, { path: "/" });
}
function cryptoRandom() {
  return [...crypto.getRandomValues(new Uint8Array(16))]
    .map(b => b.toString(16).padStart(2, "0")).join("");
}
