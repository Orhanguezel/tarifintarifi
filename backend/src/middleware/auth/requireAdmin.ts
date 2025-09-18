// src/middleware/auth/requireAdmin.ts
import type { Request, Response, NextFunction } from "express";
import { requireAuth } from "./requireAuth";

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  return requireAuth(req, res, () => {
    if (req.user?.role !== "admin") return res.status(403).json({ error: "FORBIDDEN" });
    next();
  });
}
