// src/middleware/error.ts
import type { Request, Response, NextFunction } from "express";

export function notFound(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    error: "NOT_FOUND",
    message: "Not Found",
    path: req.originalUrl,
  });
}

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  const isProd = process.env.NODE_ENV === "production";

  // Mongoose / validation benzeri hataları 4xx yap
  const status =
    err?.status ??
    (err?.name === "ValidationError" || err?.name === "CastError" ? 422 : 500);

  const payload: Record<string, unknown> = {
    success: false,
    error: err?.code || err?.name || "SERVER_ERROR",
    message: err?.message || "Server Error",
  };

  if (!isProd) {
    // Geliştirmede ayrıntı ver
    payload.details = err?.errors || null;
    payload.stack = err?.stack;
    // Konsola da bas
    // eslint-disable-next-line no-console
    console.error("[error]", err);
  }

  res.status(status).json(payload);
}
