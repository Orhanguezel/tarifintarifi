// src/middleware/locale.ts
import type { Request, Response, NextFunction } from "express";
import { SUPPORTED_LOCALES, DEFAULT_LOCALE, type SupportedLocale } from "@/config/locales";
import { tFactory } from "@/i18n";

function pickLocale(req: Request): SupportedLocale {
  const q = String(req.query.lang || "").toLowerCase();
  const h = String(req.header("x-lang") || "").toLowerCase();
  const al = String(req.header("accept-language") || "").toLowerCase().slice(0, 2);
  const cand = (q || h || al) as SupportedLocale;
  return (SUPPORTED_LOCALES as readonly string[]).includes(cand) ? cand : DEFAULT_LOCALE;
}

export function localeMiddleware(req: Request, _res: Response, next: NextFunction) {
  const locale = pickLocale(req);
  req.locale = locale;
  req.t = tFactory(locale);
  next();
}
