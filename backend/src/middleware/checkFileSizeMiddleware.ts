// src/core/middleware/checkFileSizeMiddleware.ts
import type { Request, Response, NextFunction } from "express";

export const checkFileSizeMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const files: Express.Multer.File[] = [];
  if (Array.isArray(req.files)) files.push(...(req.files as Express.Multer.File[]));
  else if (req.files && typeof req.files === "object") {
    Object.values(req.files).forEach(arr => files.push(...(arr as Express.Multer.File[])));
  } else if (req.file) files.push(req.file);

  const max = req.uploadSizeLimit || 20 * 1024 * 1024;
  for (const f of files) {
    if (f.size > max) {
      return res.status(400).json({
        success: false,
        message: `File ${f.originalname} exceeds ${(max / (1024 * 1024)).toFixed(1)} MB limit.`,
      });
    }
  }
  next();
};
