import type { Request, Response, NextFunction } from "express";
import { normalizeCategoryKey } from "./categories";

/** ortak yardımcılar */
const isNonNegInt = (v: unknown) => /^\d+$/.test(String(v));
const inRange = (n: number, min: number, max: number) => n >= min && n <= max;

/* ===================== PUBLIC ===================== */

export function validatePublicQuery(req: Request, res: Response, next: NextFunction) {
  const { q, tag, maxTime, limit, category } = req.query as Record<string, unknown>;

  if (maxTime != null && String(maxTime).trim() !== "") {
    if (!isNonNegInt(maxTime)) {
      return res.status(400).json({ success: false, message: "maxTime must be a non-negative integer" });
    }
  }

  const MAX_LIMIT = Number(process.env.RECIPES_PUBLIC_LIST_MAX || 200);
  if (limit != null && String(limit).trim() !== "") {
    if (!isNonNegInt(limit) || !inRange(Number(limit), 1, MAX_LIMIT)) {
      return res.status(400).json({ success: false, message: `limit must be 1..${MAX_LIMIT}` });
    }
  }

  if (q   != null && typeof q   !== "string") return res.status(400).json({ success: false, message: "q must be string" });
  if (tag != null && typeof tag !== "string") return res.status(400).json({ success: false, message: "tag must be string" });

  if (category != null && String(category).trim() !== "" && !normalizeCategoryKey(category)) {
    return res.status(400).json({ success: false, message: "invalid category key" });
  }
  next();
}

export function validateSlug(req: Request, res: Response, next: NextFunction) {
  const { slug: raw } = req.params as { slug?: string };
  const dec = decodeURIComponent(String(raw || "")).trim();
  if (!dec || !/^[a-z0-9-]+$/.test(dec)) {
    return res.status(400).json({ success: false, message: "Invalid slug" });
  }
  next();
}

export function validateSearchQuery(req: Request, res: Response, next: NextFunction) {
  const { q, limit, category } = req.query as Record<string, unknown>;

  if (q != null && typeof q !== "string") {
    return res.status(400).json({ success: false, message: "q must be string" });
  }

  const SUGGEST_MAX = Number(process.env.RECIPES_PUBLIC_SUGGEST_LIMIT_MAX || 25);
  if (limit != null && String(limit).trim() !== "") {
    if (!isNonNegInt(limit) || !inRange(Number(limit), 1, SUGGEST_MAX)) {
      return res.status(400).json({ success: false, message: `limit must be 1..${SUGGEST_MAX}` });
    }
  }

  if (category != null && String(category).trim() !== "" && !normalizeCategoryKey(category)) {
    return res.status(400).json({ success: false, message: "invalid category key" });
  }
  next();
}

/** Basit API key guard — header: x-api-key */
export function apiKeyGuard(req: Request, res: Response, next: NextFunction) {
  const expected = process.env.RECIPES_SUBMIT_API_KEY || process.env.API_KEY;
  const given = (req.headers["x-api-key"] || req.query.apiKey) as string | undefined;

  if (!expected) return res.status(500).json({ success: false, message: "server api key not configured" });
  if (!given || String(given) !== String(expected)) {
    return res.status(401).json({ success: false, message: "invalid api key" });
  }
  next();
}

export function validateSubmitRecipe(req: Request, res: Response, next: NextFunction) {
  const b = (req.body || {}) as Record<string, unknown>;

  const title = String(b.title ?? "").trim();
  if (!title || title.length < 3) {
    return res.status(400).json({ success: false, message: "title is required (min 3 chars)" });
  }

  if (b.category != null && String(b.category).trim() !== "" && !normalizeCategoryKey(b.category)) {
    return res.status(400).json({ success: false, message: "invalid category key" });
  }

  if (b.totalMinutes != null && String(b.totalMinutes).trim() !== "") {
    const n = Number(b.totalMinutes);
    if (!(Number.isFinite(n) && n >= 0)) {
      return res.status(400).json({ success: false, message: "totalMinutes must be >= 0" });
    }
  }

  const n = (b.nutrition || {}) as Record<string, unknown>;
  const numericOk = (...vals: unknown[]) =>
    vals.every((v) => v == null || v === "" || (Number.isFinite(Number(v)) && Number(v) >= 0));

  if (!numericOk(b.calories, n.calories, n.protein, n.carbs, n.fat, n.fiber, n.sodium)) {
    return res.status(400).json({ success: false, message: "nutrition fields must be non-negative numbers" });
  }

  if (b.tipsText != null && typeof b.tipsText !== "string") {
    return res.status(400).json({ success: false, message: "tipsText must be string" });
  }

  next();
}

/* ===================== ADMIN (ek) ===================== */

export function validateAdminListQuery(req: Request, res: Response, next: NextFunction) {
  const { page = "1", limit = "20", q, status, tag, category } =
    req.query as Record<string, string>;

  if (!isNonNegInt(page) || Number(page) < 1) {
    return res.status(400).json({ error: "page must be >=1" });
  }
  if (!isNonNegInt(limit) || !inRange(Number(limit), 1, 100)) {
    return res.status(400).json({ error: "limit must be 1..100" });
  }
  if (q != null && typeof q !== "string") {
    return res.status(400).json({ error: "q must be string" });
  }
  if (status && !["draft", "published"].includes(status)) {
    return res.status(400).json({ error: "status must be draft|published" });
  }
  if (tag != null && typeof tag !== "string") {
    return res.status(400).json({ error: "tag must be string" });
  }
  if (category != null && String(category).trim() !== "" && !normalizeCategoryKey(category)) {
    return res.status(400).json({ error: "invalid category key" });
  }
  next();
}

export function validateAdminStatusPatch(req: Request, res: Response, next: NextFunction) {
  const { isPublished } = (req.body || {}) as { isPublished?: unknown };
  if (typeof isPublished !== "boolean") {
    return res.status(400).json({ error: "isPublished(boolean) is required" });
  }
  next();
}
