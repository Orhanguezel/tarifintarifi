// src/middleware/auth/csrf.ts
import type { Request, Response, NextFunction } from "express";
import { CSRF_COOKIE, setCsrfCookie } from "./cookieUtils";

const SAFE = new Set(["GET", "HEAD", "OPTIONS"]);

export function csrf(req: Request, res: Response, next: NextFunction) {
  const method = (req.method || "GET").toUpperCase();

  // Cookie yoksa üret / varsa süreyi yenile
  let csrfCookie = req.cookies?.[CSRF_COOKIE];
  if (!csrfCookie) {
    csrfCookie = setCsrfCookie(res);
  }

  // Güvenli metodlar: yalnızca cookie üret/yenile, doğrulama yapma
  if ( SAFE.has(method) ) {
    return next();
  }

  // Yazma metodları: double-submit kontrolü (header || body._csrf)
  const header =
    req.get("X-CSRF-Token") ||
    req.get("x-csrf-token") ||
    (req.body && (req.body._csrf as string));

  if (header && csrfCookie && header === csrfCookie) {
    return next();
  }

  return res.status(403).json({ error: "CSRF_VALIDATION_FAILED" });
}
