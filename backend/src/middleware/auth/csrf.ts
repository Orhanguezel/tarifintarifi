// src/middleware/auth/csrf.ts
import type { Request, Response, NextFunction } from "express";

const CSRF_COOKIE = process.env.CSRF_COOKIE_NAME || "tt_csrf";

export function csrf(req: Request, res: Response, next: NextFunction) {
  const csrfCookie = req.cookies?.[CSRF_COOKIE];
  const csrfHeader = req.get("X-CSRF-Token");
  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    return res.status(403).json({ error: "CSRF_VALIDATION_FAILED" });
  }
  next();
}
