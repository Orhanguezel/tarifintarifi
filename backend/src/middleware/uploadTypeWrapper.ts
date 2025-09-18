// src/core/middleware/uploadTypeWrapper.ts
import type { UploadFolderKey } from "./upload.constants";
import type { Request, Response, NextFunction } from "express";


export const uploadSizeLimits: Record<UploadFolderKey, number> = {
  recipe: 30 * 1024 * 1024,
  files:  50 * 1024 * 1024,
  default: 20 * 1024 * 1024,
};

export const uploadTypeWrapper = (type: UploadFolderKey) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    req.uploadType = type;
    req.uploadSizeLimit = uploadSizeLimits[type] || uploadSizeLimits.default;
    next();
  };
};
