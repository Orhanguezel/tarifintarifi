// src/middleware/auth/requireAuth.ts
import type { Request, Response, NextFunction } from "express";
import { verifyAccess } from "./jwt";
import { getTokenFromRequest } from "./authHelpers";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = getTokenFromRequest(req);
  if (!token) return res.status(401).json({ error: "UNAUTHORIZED" });

  try {
    const p = verifyAccess(token);
    req.user = { _id: p.sub, email: p.email, role: p.role };
    next();
  } catch {
    return res.status(401).json({ error: "UNAUTHORIZED" });
  }
}
