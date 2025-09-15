import type { Request, Response, NextFunction } from "express";

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ success: false, message: "Not Found" });
}

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  const status = err.status || 500;
  const message = err.message || "Server Error";
  if (process.env.NODE_ENV !== "production") {
    console.error("[error]", err);
  }
  res.status(status).json({ success: false, message });
}
