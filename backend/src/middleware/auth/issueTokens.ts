// src/middleware/auth/issueTokens.ts
import type { Response } from "express";
import { signAccess, type JwtPayload } from "./jwt";
import { setTokenCookie, clearTokenCookie, setCsrfCookie, clearCsrfCookie } from "./cookieUtils";

export function setAuthCookies(res: Response, payload: JwtPayload) {
  const at = signAccess(payload);
  setTokenCookie(res, at);
  const csrf = setCsrfCookie(res);
  return { at, csrf };
}

export function clearAuthCookies(res: Response) {
  clearTokenCookie(res);
  clearCsrfCookie(res);
}
