// src/middleware/uploadTypeWrapper.ts
import type { UploadFolderKey } from "./upload.constants";
import type { Request, Response, NextFunction } from "express";

export const uploadSizeLimits: Record<UploadFolderKey, number> = {
  recipe: 30 * 1024 * 1024,
  files:  50 * 1024 * 1024,
  default: 20 * 1024 * 1024,
};

export const uploadTypeWrapper = (type: UploadFolderKey) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    (req as any).uploadType = type;
    (req as any).uploadSizeLimit = uploadSizeLimits[type] || uploadSizeLimits.default;
    next();
  };
};
